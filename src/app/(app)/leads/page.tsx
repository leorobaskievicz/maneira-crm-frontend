'use client';
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { KanbanSkeleton } from '@/components/kanban/KanbanSkeleton';
import api from '@/lib/api';

export default function LeadsPage() {
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBoard = async () => {
    try {
      const r = await api.get('/boards');
      const leadsBoard = r.data.find((b: any) => b.name === 'Leads');
      if (leadsBoard) {
        const bd = await api.get(`/boards/${leadsBoard.id}`);
        setBoard(bd.data);
      }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBoard(); }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 } }}>
      {loading || !board
        ? <KanbanSkeleton columns={5} />
        : <KanbanBoard board={board} setBoard={setBoard} reload={loadBoard} variant="leads" />}
    </Box>
  );
}
