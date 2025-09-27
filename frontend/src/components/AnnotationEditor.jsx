import useStore from '../state/useStore.js';

export default function AnnotationEditor() {
  const {
    annotationEditor,
    updateAnnotationEditor,
    closeAnnotationEditor,
    addAnnotation
  } = useStore((state) => ({
    annotationEditor: state.annotationEditor,
    updateAnnotationEditor: state.updateAnnotationEditor,
    closeAnnotationEditor: state.closeAnnotationEditor,
    addAnnotation: state.addAnnotation
  }));

  if (!annotationEditor.isOpen) {
    return null;
  }

  const handleChange = (key) => (event) => {
    updateAnnotationEditor({ [key]: event.target.value });
  };

  const handleCancel = () => {
    closeAnnotationEditor();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!annotationEditor.geometry) {
      closeAnnotationEditor();
      return;
    }

    const name = annotationEditor.name?.trim();
    const notes = annotationEditor.notes ?? '';

    addAnnotation({
      type: 'Feature',
      geometry: annotationEditor.geometry,
      id: annotationEditor.id ?? `anno-${Date.now()}`,
      properties: {
        datasetId: annotationEditor.datasetId,
        createdAt: annotationEditor.createdAt ?? new Date().toISOString(),
        name: name && name.length > 0 ? name : 'Untitled feature',
        notes
      }
    });

    closeAnnotationEditor();
  };

  return (
    <div className="annotation-editor" role="dialog" aria-modal="true" aria-labelledby="annotation-editor-title">
      <form onSubmit={handleSubmit} className="annotation-editor__form">
        <h4 id="annotation-editor-title">Annotation details</h4>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={annotationEditor.name}
            onChange={handleChange('name')}
            placeholder="New annotation"
            required
            maxLength={120}
          />
        </label>
        <label>
          <span>Notes</span>
          <textarea
            rows={4}
            value={annotationEditor.notes}
            onChange={handleChange('notes')}
            placeholder="Add contextual notes"
          />
        </label>
        <div className="annotation-editor__actions">
          <button type="button" onClick={handleCancel} className="annotation-editor__button annotation-editor__button--secondary">
            Cancel
          </button>
          <button type="submit" className="annotation-editor__button">
            Save annotation
          </button>
        </div>
      </form>
    </div>
  );
}
