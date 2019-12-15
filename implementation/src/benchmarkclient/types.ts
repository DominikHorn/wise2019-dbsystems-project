export interface BenchmarkResult {
  readonly workerID: string;
  readonly queryResults: QueryOverallResult[];
}

export interface QueryOverallResult {
  readonly queryID: string;
  readonly results: QuerySingleResult[];
}

export interface QuerySingleResult {
  readonly timestamp: Timestamp;
  readonly delta: Timestamp;
}

export interface Timestamp {
  hrfirst: number;
  hrsecond: number;
}
