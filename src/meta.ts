import { IObservableValue, IObservableArray } from "mobx";

export interface CascadeOptions {
  cascade?: boolean;
}

export interface Meta {
  __meta__: {
    key: IObservableValue<string | symbol | number | null>;

    collectionName: string | symbol | number;
    relationships: Record<
      string | symbol,
      {
        type: any;
        keys: IObservableArray<string>;
        options: CascadeOptions;
      }
    >;
    indicies: IObservableArray<string | symbol | number>;
  };
}
