import { useSyncExternalStore } from 'react';
import { sessionRecordStore } from '../records/sessionRecords';
export function useSessionRecords() { return useSyncExternalStore(sessionRecordStore.subscribe, sessionRecordStore.getSnapshot); }
