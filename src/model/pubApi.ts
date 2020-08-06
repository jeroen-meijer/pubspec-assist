import "./pubPackage";

import * as rm from "typed-rest-client/RestClient";
import * as Fuse from "fuse-js-latest";

import { escapeHtml } from "../escapeHtml";
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

export enum ResponseStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

// FIXME: Add PubResponse for FAILURE back in when necessary.
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

export class PubAPI {
  private readonly baseUrl: string;
  private restClient: rm.RestClient;

  constructor(baseUrl: string = "https://pub.dartlang.org/api/") {
    this.baseUrl = baseUrl;
    this.restClient = new rm.RestClient("Mozilla/5.0");
  }

  private generateUrl(resource: string) {
    return this.baseUrl + resource;
  }

  public async getPage(id: number = 1): Promise<PubResponse<PubPage>> {
    const response: any = await this.getPageJson(id);
    let result = PubPage.fromJSON(response);
    return SuccessResponse(result);
  }

  private async getPageJson(id: number = 1): Promise<any> {
    const res: rm.IRestResponse<any> = await this.restClient.get(
      this.generateUrl(`packages?page=${id}`)
    );
    if (!res.result) {
      throw new PubApiSearchError(PageSearchInfo(id));
    }
    return res.result;
  }

  public async searchPackage(
    query: string
  ): Promise<PubResponse<PubPackageSearch>> {
    const fullQuery = `search?q=${escapeHtml(query)}`;
    try {
      const res: rm.IRestResponse<any> = await this.restClient.get(
        this.generateUrl(fullQuery)
      );
      if (!res.result) {
        throw new PubApiSearchError(PackageSearchInfo(query));
      }
      return SuccessResponse(PubPackageSearch.fromJSON(res.result));
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
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["package"],
    };

    const response: PubResponse<PubPackageSearch> = await this.searchPackage(
      query
    );
    if (!response.result) {
      throw new PubApiSearchError(PackageSearchInfo(query));
    }

    const searchResults: PubPackageSearch = response.result;

    const fuse = new Fuse(searchResults.json.packages, fuseOptions);
    const rankedResult = (fuse.search(query) as any[]).filter(
      (element) => !element.item.package.startsWith("dart:")
    );

    const significantResults = rankedResult.filter(
      (element) => element.score <= singleReturnThreshold
    );
    if (significantResults.length === 1 && getSettings().autoAddPackage) {
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
      const res: rm.IRestResponse<Object> = await this.restClient.get(
        this.generateUrl(`packages/${name}`)
      );
      if (!res.result) {
        throw new PubApiSearchError(PackageSearchInfo(name));
      }
      return SuccessResponse(PubPackage.fromJSON(res.result));
    } catch (e) {
      throw getRestApiError(e);
    }
  }
}
