export const createDragManager = (sections, setSections) => {
  let history = [];
  let future = [];

  // ✅ SAFE CLONE (no crash)
  const clone = (data) => {
    if (!data) return [];
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return [];
    }
  };

  const updateSections = (newSections) => {
    if (!sections) return;
    history.push(clone(sections));
    future = [];
    setSections(newSections);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history.pop();
    future.unshift(clone(sections));
    setSections(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future.shift();
    history.push(clone(sections));
    setSections(next);
  };

  const onDragEnd = (result) => {
    if (!result.destination || !sections) return;

    const { source, destination, type } = result;

    const newSections = clone(sections);

    // ================= SECTION MOVE =================
    if (type === "SECTION") {
      const [moved] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, moved);
      setSections(newSections);
      return;
    }

    // ================= SUBSECTION MOVE =================
    if (type === "SUBSECTION") {
      const sIndex = Number(source.droppableId.split("-")[1]);

      const list = newSections[sIndex].subsections;
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);

      setSections(newSections);
      return;
    }

    // ================= ROW MOVE (CROSS SUPPORT) =================
    if (type === "ROW") {
      const [sSource, subSource] = source.droppableId.split("-").map(Number);
      const [sDest, subDest] = destination.droppableId.split("-").map(Number);

      const sourceRows = newSections[sSource]?.subsections[subSource]?.rows || [];
      const destRows = newSections[sDest]?.subsections[subDest]?.rows || [];

      if (!sourceRows.length) return;

      const [moved] = sourceRows.splice(source.index, 1);
      destRows.splice(destination.index, 0, moved);

      setSections(newSections);
    }
  };

  return {
    updateSections,
    undo,
    redo,
    onDragEnd
  };
};