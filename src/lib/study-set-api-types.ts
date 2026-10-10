/** Serializable records returned to the browser. No password or source notes are exposed. */
export interface StudySetSummary {
  id: string;
  title: string;
  cardCount: number;
  acceptedCount: number;
  updatedAt: string;
}

export interface StudySetListResponse {
  studySets: StudySetSummary[];
}

export interface StudySetDetailResponse {
  studySet: StudySetSummary;
}

export interface ApiErrorResponse {
  error: string;
}
