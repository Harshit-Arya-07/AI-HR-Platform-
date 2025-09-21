# AI HR Platform - AWS Deployment Guide

This guide provides comprehensive instructions for deploying the AI HR Platform to AWS using ECS Fargate, ECR, and other AWS services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Options](#deployment-options)
4. [Manual Deployment](#manual-deployment)
5. [Automated Deployment (CI/CD)](#automated-deployment-cicd)
6. [Configuration Management](#configuration-management)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)
10. [Cost Optimization](#cost-optimization)

## Prerequisites

### AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI v2.x installed and configured
- Docker installed locally
- jq installed for JSON processing

### Required AWS Services
- **Amazon ECS Fargate**: Container orchestration
- **Amazon ECR**: Container registry
- **Application Load Balancer**: Load balancing and SSL termination
- **Amazon VPC**: Network isolation
- **Amazon RDS/DocumentDB**: Database (alternative to self-managed MongoDB)
- **AWS Systems Manager Parameter Store**: Configuration management
- **Amazon CloudWatch**: Logging and monitoring
- **AWS IAM**: Identity and access management

### AWS CLI Configuration
```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity
```

### Required IAM Roles

1. **ECS Task Execution Role** (`ecsTaskExecutionRole`)
   - `AmazonECSTaskExecutionRolePolicy`
   - Custom policy for SSM Parameter Store access

2. **ECS Task Role** (`ecsTaskRole`)
   - Application-specific permissions (S3, SES, etc.)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │       ALB       │    │   ECS Fargate   │
│   (Optional)    │◄──►│  (Port 80/443)  │◄──►│    Cluster      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Route53    │    │   Target Groups │    │   3x Services   │
│   (DNS + SSL)   │    │ (Health Checks) │    │ ML/Backend/Web  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   MongoDB/RDS   │
                                               │   DocumentDB     │
                                               └─────────────────┘
```

## Deployment Options

### Option 1: Quick Deploy (Recommended)
Use the automated deployment script for a complete setup.

```bash
# Clone repository
git clone <repository-url>
cd ai-hr-platform

# Run deployment script
./infra/scripts/deploy-ecs.sh --region us-east-1 --environment production
```

### Option 2: Step-by-Step Manual Deployment
Follow the manual deployment process for more control.

### Option 3: Infrastructure as Code
Use CloudFormation/Terraform templates (advanced).

## Manual Deployment

### Step 1: Create ECR Repositories

```bash
# Set variables
REGION=us-east-1
REPO_PREFIX=hr-platform

# Create repositories
for service in ml-service backend frontend; do
  aws ecr create-repository \
    --repository-name ${REPO_PREFIX}-${service} \
    --region $REGION \
    --image-scanning-configuration scanOnPush=true
done
```

### Step 2: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# Build and push each service
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

for service in ml-service backend frontend; do
  IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/hr-platform-$service:latest
  
  # Build image
  docker build -t $IMAGE_URI ./$service/
  
  # Push image
  docker push $IMAGE_URI
done
```

### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name hr-platform-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --region $REGION
```

### Step 4: Create CloudWatch Log Groups

```bash
for service in ml-service backend frontend; do
  aws logs create-log-group \
    --log-group-name /ecs/hr-platform-$service \
    --region $REGION
  
  aws logs put-retention-policy \
    --log-group-name /ecs/hr-platform-$service \
    --retention-in-days 30 \
    --region $REGION
done
```

### Step 5: Store Configuration in Parameter Store

```bash
# Database URI (use your actual MongoDB connection string)
aws ssm put-parameter \
  --name "/hr-platform/mongodb-uri" \
  --value "mongodb+srv://username:password@cluster.mongodb.net/hr_platform" \
  --type "SecureString" \
  --region $REGION

# JWT Secret
aws ssm put-parameter \
  --name "/hr-platform/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --region $REGION
```

### Step 6: Create VPC and Security Groups

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text \
  --region $REGION)

# Create subnets
SUBNET1_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${REGION}a \
  --query 'Subnet.SubnetId' \
  --output text \
  --region $REGION)

SUBNET2_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${REGION}b \
  --query 'Subnet.SubnetId' \
  --output text \
  --region $REGION)

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --query 'InternetGateway.InternetGatewayId' \
  --output text \
  --region $REGION)

aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID \
  --region $REGION

# Create Security Group
SG_ID=$(aws ec2 create-security-group \
  --group-name hr-platform-sg \
  --description "Security group for HR Platform" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text \
  --region $REGION)
```

### Step 7: Create Application Load Balancer

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name hr-platform-alb \
  --subnets $SUBNET1_ID $SUBNET2_ID \
  --security-groups $SG_ID \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text \
  --region $REGION)

# Create target groups for each service
for service in ml-service backend frontend; do
  case $service in
    ml-service)
      PORT=8000
      ;;
    backend)
      PORT=5000
      ;;
    frontend)
      PORT=80
      ;;
  esac
  
  aws elbv2 create-target-group \
    --name hr-platform-$service-tg \
    --protocol HTTP \
    --port $PORT \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --region $REGION
done
```

### Step 8: Register Task Definitions and Create Services

Use the task definition templates in `infra/task-definitions/` and create ECS services for each component.

## Automated Deployment (CI/CD)

### GitHub Actions Setup

1. **Configure Repository Secrets:**
   - `AWS_ACCESS_KEY_ID`: AWS access key
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key
   - `SLACK_WEBHOOK`: Slack notification webhook (optional)
   - `STAGING_API_URL`: Staging environment URL for testing

2. **Workflow Triggers:**
   - Push to `main` branch: Full deployment
   - Push to `develop` branch: Deploy to staging
   - Pull requests: Run tests and security scans

3. **Pipeline Stages:**
   - **Test**: Run unit tests for all services
   - **Build**: Build and push Docker images to ECR
   - **Deploy**: Update ECS task definitions and services
   - **Verify**: Run health checks and performance tests
   - **Notify**: Send deployment status notifications

## Configuration Management

### Environment Variables

**ML Service:**
```bash
MONGODB_URI=mongodb://...
ENVIRONMENT=production
LOG_LEVEL=info
MODEL_PATH=/app/models
```

**Backend Service:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb://...
ML_SERVICE_URL=http://ml-service:8000
JWT_SECRET=...
FRONTEND_URL=https://yourdomain.com
```

**Frontend Service:**
```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

### Parameter Store Hierarchy
```
/hr-platform/
├── mongodb-uri (SecureString)
├── jwt-secret (SecureString)
├── aws-access-key (SecureString)
├── aws-secret-key (SecureString)
└── external-api-keys/ (SecureString)
    ├── openai-key
    └── sendgrid-key
```

## Monitoring and Logging

### CloudWatch Dashboards

Create custom dashboards to monitor:
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, network usage
- **Business Metrics**: Candidate processing rates, ML accuracy scores

### Log Aggregation

- **Application Logs**: Structured JSON logging with correlation IDs
- **Access Logs**: ALB access logs stored in S3
- **Performance Logs**: Custom metrics and performance data

### Alerting

Set up CloudWatch alarms for:
- High error rates (>5% for 5 minutes)
- High response times (>2s average for 5 minutes)
- Resource utilization (CPU >80% or Memory >85%)
- Service health check failures

```bash
# Example alarm creation
aws cloudwatch put-metric-alarm \
  --alarm-name hr-platform-high-error-rate \
  --alarm-description "High error rate detected" \
  --metric-name ErrorRate \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Security Considerations

### Network Security
- **VPC Isolation**: All services run in private subnets
- **Security Groups**: Least privilege access rules
- **WAF Protection**: AWS WAF for application-layer protection

### Data Security
- **Encryption at Rest**: EBS/RDS encryption enabled
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Secret Management**: AWS Systems Manager Parameter Store

### Access Control
- **IAM Roles**: Service-specific roles with minimal permissions
- **Network ACLs**: Additional network-level security
- **Container Security**: Regular vulnerability scanning with Trivy

### Compliance
- **Data Retention**: Automated log rotation and deletion
- **Audit Logging**: All API calls logged to CloudTrail
- **GDPR Compliance**: Data anonymization and deletion capabilities

## Troubleshooting

### Common Issues

**1. Service Won't Start**
```bash
# Check ECS service events
aws ecs describe-services --cluster hr-platform-cluster --services hr-platform-backend

# Check task logs
aws logs get-log-events --log-group-name /ecs/hr-platform-backend --log-stream-name <stream-name>
```

**2. Database Connection Issues**
```bash
# Test parameter store access
aws ssm get-parameter --name /hr-platform/mongodb-uri --with-decryption

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

**3. Load Balancer Health Check Failures**
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Verify health check endpoint
curl -f http://your-service:port/health
```

### Debug Commands

```bash
# ECS service status
aws ecs describe-services --cluster hr-platform-cluster --services hr-platform-ml-service

# Task definition details
aws ecs describe-task-definition --task-definition hr-platform-ml-service

# CloudWatch logs
aws logs tail /ecs/hr-platform-ml-service --follow

# Parameter store values
aws ssm describe-parameters --filters Key=Name,Values=/hr-platform/
```

## Cost Optimization

### Right-Sizing Resources

**Development Environment:**
- ML Service: 0.5 CPU, 1GB RAM
- Backend: 0.25 CPU, 0.5GB RAM
- Frontend: 0.25 CPU, 0.5GB RAM

**Production Environment:**
- ML Service: 1 CPU, 2GB RAM
- Backend: 0.5 CPU, 1GB RAM
- Frontend: 0.25 CPU, 0.5GB RAM

### Auto-Scaling Configuration

```json
{
  "ServiceName": "hr-platform-backend",
  "ScalableDimension": "ecs:service:DesiredCount",
  "PolicyName": "cpu-scaling",
  "TargetTrackingScalingPolicies": [
    {
      "TargetValue": 70.0,
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
      }
    }
  ]
}
```

### Cost Monitoring

- **AWS Cost Explorer**: Track spending by service
- **Resource Tagging**: Tag resources for cost allocation
- **Reserved Capacity**: Consider reserved instances for predictable workloads
- **Spot Instances**: Use Spot capacity for development/testing

### Estimated Monthly Costs (us-east-1)

**Production Environment:**
- ECS Fargate: $150-300/month
- Application Load Balancer: $20/month
- CloudWatch Logs: $10-20/month
- Data Transfer: $10-30/month
- **Total**: ~$200-370/month

**Development Environment:**
- ECS Fargate: $50-100/month
- Shared ALB: $10/month
- CloudWatch Logs: $5/month
- **Total**: ~$65-115/month

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Weekly:**
   - Review CloudWatch dashboards and alerts
   - Check security scan results
   - Update dependencies in development

2. **Monthly:**
   - Review AWS costs and optimization opportunities
   - Update base Docker images
   - Rotate secrets and access keys

3. **Quarterly:**
   - Review and update security policies
   - Conduct disaster recovery drills
   - Performance testing and optimization

### Update Procedures

1. **Application Updates:**
   - Use blue/green deployments via ECS
   - Automated rollback on health check failures
   - Gradual traffic shifting for validation

2. **Infrastructure Updates:**
   - Test changes in staging environment first
   - Use CloudFormation drift detection
   - Maintain infrastructure as code

This deployment guide provides a comprehensive foundation for deploying and managing the AI HR Platform on AWS. For specific questions or issues, refer to the troubleshooting section or AWS documentation.