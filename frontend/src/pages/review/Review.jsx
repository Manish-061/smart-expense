import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// Validations for the editable fields
const reviewSchema = z.object({
  amount: z.number({ invalid_type_error: "Amount must be a number" }).min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required").max(255),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
});

export default function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ocrData = location.state?.ocrData;

  // Initialize form with OCR data or empty defaults
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      amount: ocrData?.amount || "",
      description: ocrData?.merchantName || "",
      date: ocrData?.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      category: "", // User must select category for Phase 3
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      // Build the ReceiptExpenseRequest payload
      const payload = {
        amount: formData.amount,
        description: formData.description,
        date: formData.date,
        category: formData.category,
        receiptUrl: ocrData.receiptUrl,
        rawOcrData: JSON.stringify(ocrData),
      };
      const response = await api.post("/expenses/from-receipt", payload);
      return response.data;
    },
    onSuccess: () => {
      // Refresh expenses data and redirect
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigate("/expenses");
    },
  });

  if (!ocrData) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">No receipt data found</h2>
        <p className="text-gray-500 mb-6">Please upload a receipt to use this feature.</p>
        <Button onClick={() => navigate("/upload")}>Go to Upload</Button>
      </div>
    );
  }

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/upload")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Receipt</h1>
          <p className="text-gray-600 mt-1">Verify the extracted details and assign a category.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Preview */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 flex items-center justify-center min-h-[400px]">
          {ocrData.receiptImageUrl ? (
            <img 
              src={ocrData.receiptImageUrl} 
              alt="Uploaded receipt" 
              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
            />
          ) : ocrData.receiptUrl ? (
            <img 
              src={ocrData.receiptUrl} 
              alt="Uploaded receipt" 
              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
            />
          ) : (
            <p className="text-gray-500">Image preview not available</p>
          )}
        </div>

        {/* Right Column: Editable Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Extracted Details</h3>
          
          {saveMutation.isError && (
            <div className="p-3 mb-6 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              Failed to save expense. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-gray-400 font-normal ml-2">(Confidence: {(ocrData.amountConfidence * 100).toFixed(0)}%)</span>
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    error={errors.amount?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant / Description <span className="text-gray-400 font-normal ml-2">(Confidence: {(ocrData.merchantConfidence * 100).toFixed(0)}%)</span>
              </label>
              <Input
                placeholder="e.g. Starbucks, Walmart"
                {...register("description")}
                error={errors.description?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-gray-400 font-normal ml-2">(Confidence: {(ocrData.dateConfidence * 100).toFixed(0)}%)</span>
              </label>
              <Input
                type="date"
                {...register("date")}
                error={errors.date?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register("category")}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.category ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select a category</option>
                <option value="FOOD">Food & Dining</option>
                <option value="TRANSPORT">Transportation</option>
                <option value="SHOPPING">Shopping</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="BILLS">Bills & Utilities</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button type="submit" className="w-full" isLoading={saveMutation.isPending}>
                <Save className="w-5 h-5 mr-2" />
                Save Expense
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
