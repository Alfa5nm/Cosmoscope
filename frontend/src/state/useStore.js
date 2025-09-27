import { addDays, formatISO } from 'date-fns';
import { create } from 'zustand';

const defaultDate = formatISO(new Date(), { representation: 'date' });

const createEmptyAnnotationEditor = () => ({
  isOpen: false,
  id: null,
  datasetId: null,
  geometry: null,
  name: '',
  notes: '',
  createdAt: null
});

const useStore = create((set, get) => ({
  datasets: [],
  datasetStatus: 'idle',
  selectedDatasetId: null,
  selectedDate: defaultDate,
  overlays: [],
  comparisonEnabled: false,
  comparison: {
    leftDatasetId: null,
    rightDatasetId: null,
    dateOffsetDays: 0
  },
  comparisonPosition: 0.5,
  annotations: [],
  annotationMode: 'idle',
  annotationStatus: 'idle',
  annotationEditor: createEmptyAnnotationEditor(),
  mapExtent: null,
  mapCenter: [0, 0],
  mastResults: [],
  mastStatus: 'idle',
  mastError: null,
  pdsResults: [],
  pdsStatus: 'idle',
  pdsError: null,
  snapshotStatus: 'idle',
  snapshotData: null,
  setDatasets: (datasets) => {
    const current = get().selectedDatasetId;
    const firstId = datasets.length > 0 ? datasets[0].id : null;
    set({
      datasets,
      datasetStatus: 'ready',
      selectedDatasetId: current || firstId,
      comparison: {
        leftDatasetId: current || firstId,
        rightDatasetId: datasets.find((d) => d.category !== 'earth')?.id || firstId,
        dateOffsetDays: 0
      }
    });
  },
  setDatasetStatus: (status) => set({ datasetStatus: status }),
  selectDataset: (datasetId) => set({ selectedDatasetId: datasetId }),
  setSelectedDate: (isoDate) => set({ selectedDate: isoDate }),
  setRelativeDate: (daysOffset) => {
    const iso = formatISO(addDays(new Date(), daysOffset), { representation: 'date' });
    set({ selectedDate: iso });
  },
  toggleOverlay: (datasetId) => {
    const overlays = get().overlays;
    if (overlays.includes(datasetId)) {
      set({ overlays: overlays.filter((id) => id !== datasetId) });
    } else {
      set({ overlays: [...overlays, datasetId] });
    }
  },
  setComparisonEnabled: (enabled) => set({ comparisonEnabled: enabled }),
  setComparison: (partial) => set({ comparison: { ...get().comparison, ...partial } }),
  setComparisonPosition: (value) => set({ comparisonPosition: value }),
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) => set({ annotations: [...get().annotations, annotation] }),
  clearAnnotations: () => set({ annotations: [] }),
  setAnnotationMode: (mode) => set({ annotationMode: mode }),
  setAnnotationStatus: (status) => set({ annotationStatus: status }),
  openAnnotationEditor: (payload) =>
    set({ annotationEditor: { ...createEmptyAnnotationEditor(), ...payload, isOpen: true } }),
  updateAnnotationEditor: (updates) =>
    set({ annotationEditor: { ...get().annotationEditor, ...updates } }),
  closeAnnotationEditor: () => set({ annotationEditor: createEmptyAnnotationEditor() }),
  setMapState: ({ extent, center }) =>
    set({ mapExtent: extent ?? get().mapExtent, mapCenter: center ?? get().mapCenter }),
  setMastStatus: (status) => set({ mastStatus: status }),
  setMastResults: (results) => set({ mastResults: results }),
  setMastError: (error) => set({ mastError: error }),
  setPdsStatus: (status) => set({ pdsStatus: status }),
  setPdsResults: (results) => set({ pdsResults: results }),
  setPdsError: (error) => set({ pdsError: error }),
  setSnapshotStatus: (status) => set({ snapshotStatus: status }),
  setSnapshotData: (data) => set({ snapshotData: data })
}));

export default useStore;
