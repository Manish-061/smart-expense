import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { CategorySelect } from "../../components/ui/CategorySelect";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { getCategoryConfig } from "../../lib/categories";

// Validations for the editable fields
const reviewSchema = z.object({
  amount: z.number({ invalid_type_error: "Amount must be a number" }).min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required").max(255),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
});

function ConfidenceIndicator({ score }) {
  const percentage = Math.round(score * 100);
  let color = "text-red-500";
  let bg = "bg-red-100";
  if (percentage >= 70) { color = "text-emerald-600"; bg = "bg-emerald-100"; }
  else if (percentage >= 40) { color = "text-amber-600"; bg = "bg-amber-100"; }
  return (
    <span className={`inline-flex items-center text-xs font-medium ${color} ${bg} px-2 py-0.5 rounded-full`}>
      {percentage}% confident
    </span>
  );
}

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
      date: ocrData?.date || new Date().toISOString().split('T')[0],
      category: ocrData?.suggestedCategory || "",
    },
  });

  const watchedCategory = useWatch({ control, name: "category" });
  const isOverridden = ocrData?.suggestedCategory && watchedCategory !== ocrData.suggestedCategory;

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const payload = {
        amount: formData.amount,
        description: formData.description,
        date: formData.date,
        category: formData.category,
        receiptUrl: ocrData.receiptUrl,
        rawOcrData: JSON.stringify(ocrData),
        suggestedCategory: ocrData.suggestedCategory || null,
      };
      const response = await api.post("/expenses/from-receipt", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigate("/expenses");
    },
  });

  if (!ocrData) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No receipt data found</h2>
        <p className="text-gray-500 mb-6">Please upload a receipt image first to review and save it.</p>
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Review Receipt</h1>
          <p className="text-gray-600 mt-1">Verify the extracted details and assign a category.</p>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      {ocrData.suggestedCategory && (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="flex-1">
            <p className="text-xs text-indigo-600 mt-0.5">
              You can override this below. Check for the category.
            </p>
          </div>
        </div>
      )}

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
            <div className="p-3 mb-6 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Failed to save expense. Please try again.
            </div>
          )}

          {saveMutation.isSuccess && (
            <div className="p-3 mb-6 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Expense saved successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
              </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Merchant / Description
                </label>
              </div>
              <Input
                placeholder="e.g. Starbucks, Walmart"
                {...register("description")}
                error={errors.description?.message}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
              </div>
              <Input
                type="date"
                {...register("date")}
                error={errors.date?.message}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
              </div>
              <CategorySelect
                {...register("category")}
                error={errors.category?.message}
              />
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
