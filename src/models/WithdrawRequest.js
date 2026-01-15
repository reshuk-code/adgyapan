import mongoose from 'mongoose';

const WithdrawRequestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    method: {
        type: String,
        enum: ['wallet', 'bank', 'khalti', 'esewa', 'other'],
        required: true,
    },
    methodDetails: {
        type: String, // Bank account info, phone number, etc.
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending',
    },
    adminNote: String,
    processedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.WithdrawRequest || mongoose.model('WithdrawRequest', WithdrawRequestSchema);
