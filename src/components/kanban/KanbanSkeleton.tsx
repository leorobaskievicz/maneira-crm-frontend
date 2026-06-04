'use client';
import { Box, Skeleton } from '@mui/material';

export function KanbanSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden', alignItems: 'flex-start' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Box key={i} sx={{ minWidth: 288, width: 288, backgroundColor: '#F0ECEC', borderRadius: '12px', border: '1px solid #E6DEDE', p: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Skeleton width={100} height={20} />
            <Skeleton variant="circular" width={20} height={20} />
          </Box>
          {Array.from({ length: 3 - (i % 2) }).map((__, j) => (
            <Skeleton key={j} variant="rounded" height={64} sx={{ mb: 1, borderRadius: '10px' }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
