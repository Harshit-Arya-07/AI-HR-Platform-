const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: [{ type: String, trim: true }],
  skills: [{ type: String, trim: true }],
  location: { type: String, trim: true },
  salaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed'],
    default: 'draft'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationDeadline: Date,
  candidateCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ postedBy: 1 });

// Update candidate count when candidates are added/removed
jobSchema.methods.updateCandidateCount = async function() {
  const Candidate = mongoose.model('Candidate');
  this.candidateCount = await Candidate.countDocuments({ jobId: this._id });
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema);