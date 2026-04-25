import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import api from "../../lib/api";
import { FileUploader } from "../../components/upload/FileUploader";
import { Button } from "../../components/ui/Button";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: async (selectedFile) => {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/expenses/receipt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to review page, passing the OCR data via state
      navigate("/review", { state: { ocrData: data } });
    },
    onError: (error) => {
      setUploadError(
        error.response?.data?.message || "Failed to process receipt. Please try again."
      );
    },
  });

  const handleUpload = () => {
    if (!file) return;
    setUploadError("");
    uploadMutation.mutate(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-gray-600 mt-1">
          Upload a clear image of your receipt. Our smart OCR will extract the details automatically.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <FileUploader
          onFileSelect={setFile}
          disabled={uploadMutation.isPending}
        />

        {uploadError && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {uploadError}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            className="w-full sm:w-auto"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Receipt...
              </>
            ) : (
              <>
                Analyze Receipt
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress State UX */}
      {uploadMutation.isPending && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center animate-pulse">
          <h3 className="text-primary font-medium text-lg">OCR is processing your receipt...</h3>
          <p className="text-gray-500 text-sm mt-2">
            This usually takes a few seconds depending on the image quality.
          </p>
        </div>
      )}
    </div>
  );
}
