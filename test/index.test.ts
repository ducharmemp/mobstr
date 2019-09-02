import { configure } from "mobx";

configure({
  enforceActions: "observed"
});

import "./integration.test";
import "./unit/decorators.test";
import "./unit/index.test";
import "./unit/utils.test";
import "./unit/store.test";
import "./unit/triggers.test";
import "./unit/constraints.test";
import "./unit/errors.test";
