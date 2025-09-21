#!/bin/bash

# AI HR Platform - AWS ECS Fargate Deployment Script
# This script deploys the containerized services to AWS ECS Fargate

set -e  # Exit on any error

# Configuration
REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME="hr-platform-cluster"
SERVICE_NAME_PREFIX="hr-platform"
ECR_REPOSITORY_PREFIX="hr-platform"
ENVIRONMENT=${ENVIRONMENT:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    command -v aws >/dev/null 2>&1 || { print_error "AWS CLI is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed."; exit 1; }
    command -v jq >/dev/null 2>&1 || { print_error "jq is required but not installed."; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { print_error "AWS credentials not configured."; exit 1; }
    
    print_status "Prerequisites check passed!"
}

# Get AWS Account ID
get_account_id() {
    aws sts get-caller-identity --query Account --output text
}

# Create ECR repositories if they don't exist
create_ecr_repositories() {
    print_status "Creating ECR repositories..."
    
    ACCOUNT_ID=$(get_account_id)
    SERVICES=("ml-service" "backend" "frontend")
    
    for service in "${SERVICES[@]}"; do
        REPO_NAME="${ECR_REPOSITORY_PREFIX}-${service}"
        
        # Check if repository exists
        if aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION >/dev/null 2>&1; then
            print_status "ECR repository $REPO_NAME already exists"
        else
            print_status "Creating ECR repository: $REPO_NAME"
            aws ecr create-repository \
                --repository-name $REPO_NAME \
                --region $REGION \
                --image-scanning-configuration scanOnPush=true
        fi
        
        # Set lifecycle policy
        aws ecr put-lifecycle-policy \
            --repository-name $REPO_NAME \
            --region $REGION \
            --lifecycle-policy-text '{
                "rules": [
                    {
                        "rulePriority": 1,
                        "selection": {
                            "tagStatus": "untagged",
                            "countType": "sinceImagePushed",
                            "countUnit": "days",
                            "countNumber": 7
                        },
                        "action": {
                            "type": "expire"
                        }
                    },
                    {
                        "rulePriority": 2,
                        "selection": {
                            "tagStatus": "tagged",
                            "countType": "imageCountMoreThan",
                            "countNumber": 10
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            }' >/dev/null
    done
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    ACCOUNT_ID=$(get_account_id)
    
    # Login to ECR
    aws ecr get-login-password --region $REGION | \
        docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
    
    # Build and push each service
    SERVICES=("ml-service" "backend" "frontend")
    
    for service in "${SERVICES[@]}"; do
        print_status "Building $service..."
        
        REPO_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-${service}"
        IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
        
        # Build image
        docker build -t $REPO_URI:$IMAGE_TAG -t $REPO_URI:latest ../$service/
        
        # Push image
        print_status "Pushing $service to ECR..."
        docker push $REPO_URI:$IMAGE_TAG
        docker push $REPO_URI:latest
        
        # Store image URI for later use
        export ${service//-/_}_IMAGE_URI="$REPO_URI:$IMAGE_TAG"
    done
}

# Create ECS cluster
create_ecs_cluster() {
    print_status "Creating ECS cluster..."
    
    # Check if cluster exists
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION | jq -r '.clusters[0].status' | grep -q "ACTIVE"; then
        print_status "ECS cluster $CLUSTER_NAME already exists"
    else
        print_status "Creating ECS cluster: $CLUSTER_NAME"
        aws ecs create-cluster \
            --cluster-name $CLUSTER_NAME \
            --capacity-providers FARGATE \
            --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
            --region $REGION
    fi
}

# Create task definitions
create_task_definitions() {
    print_status "Creating ECS task definitions..."
    
    ACCOUNT_ID=$(get_account_id)
    
    # ML Service task definition
    cat > ml-service-task-definition.json << EOF
{
    "family": "${SERVICE_NAME_PREFIX}-ml-service",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "ml-service",
            "image": "${ml_service_IMAGE_URI}",
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "ENVIRONMENT",
                    "value": "production"
                },
                {
                    "name": "LOG_LEVEL",
                    "value": "info"
                }
            ],
            "secrets": [
                {
                    "name": "MONGODB_URI",
                    "valueFrom": "arn:aws:ssm:${REGION}:${ACCOUNT_ID}:parameter/hr-platform/mongodb-uri"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/hr-platform-ml-service",
                    "awslogs-region": "${REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:8000/health/ || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

    # Backend service task definition
    cat > backend-task-definition.json << EOF
{
    "family": "${SERVICE_NAME_PREFIX}-backend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "backend",
            "image": "${backend_IMAGE_URI}",
            "portMappings": [
                {
                    "containerPort": 5000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "NODE_ENV",
                    "value": "production"
                },
                {
                    "name": "ML_SERVICE_URL",
                    "value": "http://ml-service:8000"
                }
            ],
            "secrets": [
                {
                    "name": "MONGODB_URI",
                    "valueFrom": "arn:aws:ssm:${REGION}:${ACCOUNT_ID}:parameter/hr-platform/mongodb-uri"
                },
                {
                    "name": "JWT_SECRET",
                    "valueFrom": "arn:aws:ssm:${REGION}:${ACCOUNT_ID}:parameter/hr-platform/jwt-secret"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/hr-platform-backend",
                    "awslogs-region": "${REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

    # Frontend service task definition
    cat > frontend-task-definition.json << EOF
{
    "family": "${SERVICE_NAME_PREFIX}-frontend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "frontend",
            "image": "${frontend_IMAGE_URI}",
            "portMappings": [
                {
                    "containerPort": 80,
                    "protocol": "tcp"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/hr-platform-frontend",
                    "awslogs-region": "${REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:80 || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

    # Register task definitions
    SERVICES=("ml-service" "backend" "frontend")
    
    for service in "${SERVICES[@]}"; do
        print_status "Registering task definition for $service..."
        aws ecs register-task-definition \
            --cli-input-json file://${service}-task-definition.json \
            --region $REGION > /dev/null
    done
}

# Create CloudWatch Log Groups
create_log_groups() {
    print_status "Creating CloudWatch log groups..."
    
    SERVICES=("ml-service" "backend" "frontend")
    
    for service in "${SERVICES[@]}"; do
        LOG_GROUP="/ecs/hr-platform-${service}"
        
        if aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION | grep -q $LOG_GROUP; then
            print_status "Log group $LOG_GROUP already exists"
        else
            print_status "Creating log group: $LOG_GROUP"
            aws logs create-log-group \
                --log-group-name $LOG_GROUP \
                --region $REGION
            
            # Set retention policy (30 days)
            aws logs put-retention-policy \
                --log-group-name $LOG_GROUP \
                --retention-in-days 30 \
                --region $REGION
        fi
    done
}

# Main deployment function
deploy() {
    print_status "Starting deployment to AWS ECS Fargate..."
    
    check_prerequisites
    create_ecr_repositories
    build_and_push_images
    create_ecs_cluster
    create_log_groups
    create_task_definitions
    
    print_status "Deployment completed successfully!"
    print_status "Next steps:"
    echo "1. Create ECS services using AWS Console or CloudFormation"
    echo "2. Set up Application Load Balancer"
    echo "3. Configure auto-scaling policies"
    echo "4. Set up monitoring and alerts"
    
    # Clean up temporary files
    rm -f *-task-definition.json
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -r, --region REGION     AWS region (default: us-east-1)"
    echo "  -e, --environment ENV   Environment (default: production)"
    echo "  -h, --help              Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run deployment
deploy