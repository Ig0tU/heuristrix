import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { apiService } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Suggestion {
  id: string;
  phase_id: string;
  suggestion_text: string;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SuggestionCardProps {
  suggestion: Suggestion;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => apiService.approveSuggestion(suggestion.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiService.rejectSuggestion(suggestion.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-full bg-yellow-500 mr-4">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Process Improvement Suggestion</h3>
          <p className="text-sm text-gray-500">Phase: {suggestion.phase_id}</p>
        </div>
      </div>
      <p className="text-gray-700 mb-2">{suggestion.suggestion_text}</p>
      <p className="text-sm text-gray-500 mb-4">{suggestion.reasoning}</p>

      {suggestion.status === 'pending' && (
        <div className="flex justify-end space-x-2">
          <Button onClick={() => rejectMutation.mutate()} variant="outline" size="sm">
            <ThumbsDown className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button onClick={() => approveMutation.mutate()} size="sm">
            <ThumbsUp className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      )}

      {suggestion.status !== 'pending' && (
        <div className="text-right text-sm font-semibold">
          {suggestion.status === 'approved' ? (
            <span className="text-green-500">Approved</span>
          ) : (
            <span className="text-red-500">Rejected</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SuggestionCard;