import React from 'react';
import { CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import '@/components/library/Library.css';

const ProgressTimeline = ({ stages = [], currentStage = 0 }) => {
  return (
    <div className="cv-timeline" role="list" aria-label="Issue progress timeline">
      {stages.map((stage, index) => {
        const done = index < currentStage;
        const active = index === currentStage;
        return (
          <div key={stage.key || stage.label || index} className={`cv-timeline-item ${done ? 'done' : ''} ${active ? 'active' : ''}`} role="listitem">
            <div className="cv-timeline-icon" aria-hidden="true">
              {done ? <CheckCircle2 size={16} /> : active ? <Clock3 size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div className="cv-timeline-content">
              <strong>{stage.label}</strong>
              {stage.timestamp ? <span>{stage.timestamp}</span> : null}
              {stage.details ? <p>{stage.details}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressTimeline;
