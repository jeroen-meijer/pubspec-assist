import * as rm from "typed-rest-client/RestClient";
import "./pubPackage";
import { PubPage } from "./pubPage";
import { PubPackage } from "./pubPackage";
import * as Fuse from "fuse-js-latest";
import { escapeHtml } from "../escapeHtml";
import { PubPackageSearch } from "./pubPackageSearch";

export enum ResponseStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE"
}

export type PubResponse<T> = {
  status: ResponseStatus;
  result: T | null;
};

const FailedResponse: PubResponse<null> = {
  status: ResponseStatus.FAILURE,
  result: null
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
    if (response) {
      let result = PubPage.fromJSON(response);
      return { status: ResponseStatus.SUCCESS, result };
    } else {
      return FailedResponse;
    }
  }

  private async getPageJson(id: number = 1): Promise<any> {
    const res: rm.IRestResponse<any> = await this.restClient.get(
      this.generateUrl(`packages?page=${id}`)
    );
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
      return {
        status: ResponseStatus.SUCCESS,
        result: PubPackageSearch.fromJSON(res.result)
      };
    } catch (e) {
      return {
        status: ResponseStatus.FAILURE,
        result: null
      };
    }
  }

  public async smartSearchPackage(
    query: string,
    singleReturnThreshold: number = 0.1
  ): Promise<PubResponse<PubPackageSearch>> {
    var fuseOptions = {
      shouldSort: true,
      includeScore: true,
      threshold: 1.0,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["package"]
    };

    const response: PubResponse<PubPackageSearch> = await this.searchPackage(
      query
    );

    if (!response.result) {
      return {
        status: ResponseStatus.FAILURE,
        result: null
      };
    }

    const searchResults: PubPackageSearch = response.result;

    const fuse: Fuse = new Fuse(searchResults.json.packages, fuseOptions);
    const rankedResult: any[] = fuse.search(query);

    const significantResults = rankedResult.filter(
      element => element.score <= singleReturnThreshold
    );

    if (significantResults.length === 1) {
      return {
        status: ResponseStatus.SUCCESS,
        result: new PubPackageSearch([significantResults[0].item.package])
      };
    } else {
      return {
        status: ResponseStatus.SUCCESS,
        result: new PubPackageSearch(
          rankedResult.map(element => element.item.package)
        )
      };
    }
  }

  public async getPackage(name: string): Promise<PubResponse<PubPackage>> {
    try {
      const res: rm.IRestResponse<Object> = await this.restClient.get(
        this.generateUrl(`packages/${name}`)
      );
      if (!res.result) {
        return FailedResponse;
      }
      return {
        status: ResponseStatus.SUCCESS,
        result: PubPackage.fromJSON(res.result)
      };
    } catch (e) {
      return FailedResponse;
    }
  }
}
