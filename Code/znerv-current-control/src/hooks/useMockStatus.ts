import { useSyncExternalStore } from 'react';
import { mockGateway } from '../services/mockGateway';

export function useMockStatus() { return useSyncExternalStore(mockGateway.subscribe, mockGateway.getSnapshot); }
