const mongoose = require("mongoose")

const treatmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
})

const visitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    symptoms: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      default: "",
    },
    treatments: [treatmentSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Calculate total amount before saving
visitSchema.pre("save", function (next) {
  this.totalAmount = this.treatments.reduce((total, treatment) => {
    return total + treatment.cost
  }, 0)
  next()
})

module.exports = mongoose.model("Visit", visitSchema)
