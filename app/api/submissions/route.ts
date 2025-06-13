import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the submission schema
const submissionSchema = new mongoose.Schema({
  tableAnalysis: {
    type: String,
    required: true
  },
  graphAnalysis: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create or get the model
const Submission = mongoose.models.dinstimneg || mongoose.model('dinstimneg', submissionSchema);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    await dbConnect();
    
    const { tableAnalysis, graphAnalysis } = await request.json();
    
    if (!tableAnalysis || !graphAnalysis) {
      return NextResponse.json(
        { error: 'Both tableAnalysis and graphAnalysis are required' },
        { status: 400 }
      );
    }
    
    const submission = new Submission({
      tableAnalysis,
      graphAnalysis
    });
    
    await submission.save();
    
    return NextResponse.json({ success: true, id: submission._id });
  } catch (error) {
    console.error('Error saving submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    await dbConnect();
    
    // Get the last 30 submissions, sorted by timestamp descending
    const submissions = await Submission
      .find({})
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();
    
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}