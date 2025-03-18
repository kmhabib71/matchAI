import React, { useState } from "react";
import { ReportReason } from "@/models/Report";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
}) => {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setDescription("");
      setEvidence([]);
      setError("");
      setSuccess("");
      setEvidenceUrl("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!reason) {
      setError("Please select a reason for reporting");
      return;
    }

    if (description.length < 10) {
      setError("Please provide a more detailed description");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description,
          evidence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess(
        "Report submitted successfully. Our team will review it shortly."
      );

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add evidence URL to the list
  const addEvidence = () => {
    if (evidenceUrl && !evidence.includes(evidenceUrl)) {
      setEvidence([...evidence, evidenceUrl]);
      setEvidenceUrl("");
    }
  };

  // Remove evidence URL from the list
  const removeEvidence = (url: string) => {
    setEvidence(evidence.filter((item) => item !== url));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Report {reportedUserName}
          </h2>

          {success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value={ReportReason.INAPPROPRIATE_CONTENT}>
                    Inappropriate Content
                  </option>
                  <option value={ReportReason.HARASSMENT}>Harassment</option>
                  <option value={ReportReason.FAKE_PROFILE}>
                    Fake Profile
                  </option>
                  <option value={ReportReason.SCAM}>Scam or Fraud</option>
                  <option value={ReportReason.UNDERAGE}>Underage User</option>
                  <option value={ReportReason.OTHER}>Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about the issue..."
                  required
                  minLength={10}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Evidence (optional)
                </label>
                <div className="flex">
                  <input
                    type="url"
                    className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="Add screenshot or image URL"
                  />
                  <button
                    type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
                    onClick={addEvidence}
                  >
                    Add
                  </button>
                </div>

                {evidence.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">
                      Added evidence:
                    </p>
                    <ul className="space-y-1">
                      {evidence.map((url, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <span className="truncate flex-1">{url}</span>
                          <button
                            type="button"
                            className="ml-2 text-red-500 hover:text-red-700"
                            onClick={() => removeEvidence(url)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
