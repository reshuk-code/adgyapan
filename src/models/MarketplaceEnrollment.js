import mongoose from 'mongoose';

const MarketplaceEnrollmentSchema = new mongoose.Schema({
    userId: {
        type: String, // Clerk ID
        required: true,
        unique: true,
    },
    legalName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    idType: {
        type: String,
        enum: ['NID', 'Passport', 'Driving License'],
        required: true,
    },
    idNumber: {
        type: String,
        required: true,
    },
    idImageUrl: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reviewNotes: String,
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: Date,
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.MarketplaceEnrollment) {
    delete mongoose.models.MarketplaceEnrollment;
}

export default mongoose.models.MarketplaceEnrollment || mongoose.model('MarketplaceEnrollment', MarketplaceEnrollmentSchema);
