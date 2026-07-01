import { PubPackage } from "./pubPackage";
import { PubPackageSearch } from "./pubPackageSearch";
import { PubPage } from "./pubPage";
import { getRestApiError } from "./pubError";
import {
  PubApiSearchError,
  PageSearchInfo,
  PackageSearchInfo,
} from "./pubError";
import { getSettings } from "../helper/getSettings";
import Fuse from "fuse.js";

export enum ResponseStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

export type PubResponse<T> = {
  status: ResponseStatus.SUCCESS;
  result: T;
};

const SuccessResponse = <T>(result: T): PubResponse<T> => {
  return {
    status: ResponseStatus.SUCCESS,
    result,
  };
};

type SearchPackageItem = { package: string };

export class PubAPI {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "https://pub.dev/api/") {
    this.baseUrl = baseUrl;
  }

  private generateUrl(resource: string) {
    return this.baseUrl + resource;
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: { "User-Agent": "pubspec-assist" },
    });
    if (!response.ok) {
      throw new PubApiSearchError(PackageSearchInfo(url));
    }
    return (await response.json()) as T;
  }

  public async getPage(id: number = 1): Promise<PubResponse<PubPage>> {
    const response = await this.getPageJson(id);
    const result = PubPage.fromJSON(response);
    return SuccessResponse(result);
  }

  private async getPageJson(id: number = 1): Promise<unknown> {
    try {
      return await this.getJson(this.generateUrl(`packages?page=${id}`));
    } catch {
      throw new PubApiSearchError(PageSearchInfo(id));
    }
  }

  public async searchPackage(
    query: string
  ): Promise<PubResponse<PubPackageSearch>> {
    const fullQuery = `search?q=${encodeURIComponent(query)}`;
    try {
      const result = await this.getJson<unknown>(this.generateUrl(fullQuery));
      return SuccessResponse(PubPackageSearch.fromJSON(result));
    } catch (e) {
      throw getRestApiError(e);
    }
  }

  public async smartSearchPackage(
    query: string,
    singleReturnThreshold: number = 0.1
  ): Promise<PubResponse<PubPackageSearch>> {
    const fuseOptions = {
      shouldSort: true,
      includeScore: true,
      threshold: 0.5,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      keys: ["package"],
    };

    const response: PubResponse<PubPackageSearch> =
      await this.searchPackage(query);
    if (!response.result) {
      throw new PubApiSearchError(PackageSearchInfo(query));
    }

    const searchResults: PubPackageSearch = response.result;

    const fuse = new Fuse<SearchPackageItem>(
      searchResults.json.packages as SearchPackageItem[],
      fuseOptions
    );
    const rankedResult = fuse
      .search(query)
      .filter((element) => !element.item.package.startsWith("dart:"));

    const significantResults = rankedResult.filter(
      (element) => (element.score ?? 1) <= singleReturnThreshold
    );
    if (
      getSettings().autoAddPackage &&
      significantResults.length > 0 &&
      (significantResults.length === 1 || significantResults[0].score === 0)
    ) {
      return {
        status: ResponseStatus.SUCCESS,
        result: new PubPackageSearch([significantResults[0].item.package]),
      };
    } else {
      return {
        status: ResponseStatus.SUCCESS,
        result: new PubPackageSearch(
          rankedResult.map((element) => element.item.package)
        ),
      };
    }
  }

  public async getPackage(name: string): Promise<PubResponse<PubPackage>> {
    try {
      const result = await this.getJson<unknown>(
        this.generateUrl(`packages/${encodeURIComponent(name)}`)
      );
      return SuccessResponse(PubPackage.fromJSON(result));
    } catch (e) {
      throw getRestApiError(e);
    }
  }
}
