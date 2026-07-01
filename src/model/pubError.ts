enum SearchType {
  PACKAGE = "PACKAGE",
  QUERY = "QUERY",
  PAGE = "PAGE",
  OTHER = "OTHER",
}

type SearchInfo =
  | {
      searchType: SearchType.QUERY;
      query: string;
      details: string;
    }
  | {
      searchType: SearchType.PAGE;
      pageNumber: number;
      details: string;
    }
  | {
      searchType: SearchType.PACKAGE;
      name: string;
      details: string;
    }
  | {
      searchType: SearchType.OTHER;
      info: string;
      details: string;
    };

export const QuerySearchInfo = (query: string): SearchInfo => {
  return {
    searchType: SearchType.QUERY,
    query,
    details: `Query: ${query}`,
  };
};
export const PageSearchInfo = (pageNumber: number): SearchInfo => {
  return {
    searchType: SearchType.PAGE,
    pageNumber,
    details: `Page number: ${pageNumber}`,
  };
};
export const PackageSearchInfo = (name: string): SearchInfo => {
  return {
    searchType: SearchType.PACKAGE,
    name,
    details: `Package name: ${name}`,
  };
};
export const OtherSearchInfo = (info: string): SearchInfo => {
  return {
    searchType: SearchType.OTHER,
    info,
    details: `Search info: ${info}`,
  };
};

export class PubError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PubError.prototype);
  }
}

export class PubApiNotRespondingError extends PubError {
  constructor() {
    super(
      "The Pub API is not responding.\nPlease check your internet connection or try again."
    );
    Object.setPrototypeOf(this, PubApiNotRespondingError.prototype);
  }
}

export class PubApiSearchError extends PubError {
  constructor(searchInfo: SearchInfo) {
    const message: string = `
    No response from Pub API call.\n
    Search type: "${searchInfo.searchType.toString()}".\n
    Details: "${searchInfo.details}".`;
    super(message);
    Object.setPrototypeOf(this, PubApiSearchError.prototype);
  }
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const networkCodes = ["ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED"];
  if (
    networkCodes.some((code) => error.message.includes(code)) ||
    error.message.includes("fetch failed")
  ) {
    return true;
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  return (
    cause instanceof Error &&
    networkCodes.some((code) => cause.message.includes(code))
  );
}

export function getRestApiError(error: unknown): PubError {
  if (isNetworkError(error)) {
    return new PubApiNotRespondingError();
  }

  return new PubError(`API error: ${error}`);
}
