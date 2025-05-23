import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  name: {
    type: String, //data type
    required: true, //validation
  },
  date: {
    type: Date,
    required: true,//validation
  },

  time: {
    type: String, // e.g., "14:30" or "2:30 PM"
    required: true,
  },
  eventId: {
    type: String,
    required: true,//validation
    unique: true,
  },
  clientName: {
    type: String,
    required: true,//validation
  },

  clientPhoneNumber: {
    type: String,
    required: true,//validation
  },
  
  clientMail: {
    type: String,
    required: true,//validation
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'Cancelled']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: String,
      default: 'System'
    }
  }]
}, {
  timestamps: true
});

// Use export default to export the model
const Event = mongoose.model("Event", eventSchema);

export default Event;  // Default export
