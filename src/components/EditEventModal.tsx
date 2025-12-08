import React from "react";
import AddEventModal, { EventData } from "./AddEventModal";

interface EditEventModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  onSave: (event: EventData) => void;
}

export default function EditEventModal({ visible, event, onClose, onSave }: EditEventModalProps) {
  // AddEventModal を再利用（editingEvent を渡す）
  return (
    <AddEventModal
      visible={visible}
      selectedDate={event?.startTime.toISOString().slice(0, 10) || ""}
      onClose={onClose}
      onSave={onSave}
      editingEvent={event}
    />
  );
}
