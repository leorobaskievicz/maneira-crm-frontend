'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { KanbanSkeleton } from '@/components/kanban/KanbanSkeleton';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function TarefasBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const router = useRouter();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBoard = async () => {
    try {
      const r = await api.get(`/boards/${boardId}`);
      setBoard(r.data);
    } catch {
      toast.error('Erro ao carregar quadro');
      router.push('/tarefas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (boardId) loadBoard(); }, [boardId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
        <IconButton onClick={() => router.push('/tarefas')} sx={{ backgroundColor: '#fff', border: '1px solid #EDE8E8', '&:hover': { borderColor: '#A0585A' } }}>
          <ArrowBackOutlinedIcon fontSize="small" />
        </IconButton>
        <Box>
          {loading ? (
            <Skeleton width={220} height={32} />
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{board?.name}</Typography>
              {board?.description && <Typography variant="body2" color="text.secondary">{board.description}</Typography>}
            </>
          )}
        </Box>
      </Box>

      {loading || !board
        ? <KanbanSkeleton />
        : <KanbanBoard board={board} setBoard={setBoard} reload={loadBoard} variant="tasks" />}
    </Box>
  );
}
