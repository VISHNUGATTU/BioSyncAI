import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  // 1. The Link: Ties this scan directly to the user who took it
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  
  // 2. The Matter: What did they eat?
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  
  // 3. The Visual: Where the Cloudinary image URL will go
  imageUrl: {
    type: String, 
    default: ''
  },

  // 4. The Telemetry: How did it affect their blood sugar?
  glucoseImpact: {
    type: Number, 
    required: true, // e.g., 45 (for a +45 mg/dL spike)
  },
  
  // 5. The AI Verdict: For our HistoryScreen filters
  verdict: {
    type: String,
    enum: ['OPTIMAL', 'MODERATE', 'SPIKE'],
    required: true,
  },

  // 6. The Nutritional Breakdown: For the HealthScreen progress bars
  macros: {
    carbs: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fats: { type: Number, default: 0 }
  }

}, { 
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt' for our timeline!
});

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;