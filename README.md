# [MobStr](https://ducharmemp.github.io/mobstr/)
[![CircleCI](https://circleci.com/gh/ducharmemp/mobstr.svg?style=svg)](https://circleci.com/gh/ducharmemp/mobstr) [![CodeCov](https://codecov.io/gh/ducharmemp/mobstr/branch/master/graph/badge.svg)](https://codecov.io/gh/ducharmemp/mobstr) [![npm version](https://img.shields.io/npm/v/@ducharmemp/mobstr)](https://www.npmjs.com/package/@ducharmemp/mobstr "View this project on npm")

MobStr is a project designed to provide an ORM-like interface to a MobX store. The goal of this project is to achieve a low-overhead, normalized approach to modeling to allow developers to focus on domain modeling without having to deal with manual book-keeping of object relationships. It also provides an opt-in approach to constraint checking, which can lead to better performance since we simply don't check every field.

## Benefits
* Simple and direct query API to find/delete entries from the data store
* Declarative API for describing object models in a manner similar to other data stores
* Relationship cascades and auto-cleanup for removed objects
* Separation of concerns for managing object models and RESTful/GraphQL API queries (no sagas/thunks)
* Update objects directly without the need for complex copy operations
* Opt-in semantics for constraints and checks on columns for debugging purposes and sanity checks.

## Technical Details
<details>
  <summary><b>Rationale</b></summary>
  While developing projects, I found myself maintaining more maps and objects for relationship maintenance than I enjoyed, and had to remember to invalidate those relationships with objects to avoid having dangling references to deleted objects. I also disliked the overall method that I had to use to find the related objects. Too often I find myself accidentally slipping in attributes that are meant to achieve faster performance for lookup to my store objects, such as maps or objects. This works for a time, but then my model becomes polluted with extra attributes that I need to keep in sync and the model deviates further from my actual intention.<br><br>

  Additionally, it's actually fairly easy to make certain guarantees that MobX provides invalid by complete accident, especially when copying string keys from observable objects into another observable. The answer is to leverage `computed` or `autorun` or other reaction-based functions, but this library *should* abstract over those to the point where the user doesn't need to necessarily worry about committing error-prone code in these specialized cases.<br><br>


  There do exist other solutions in the MobX examples and they are perfectly valid, but they require passing around parent contexts and there isn't an out of the box solution for saying "I have all of these models that I know are related to parents, but I just want these without looping through all of the parents". Consider this example store code loosely lifted from the MobX documentation:

```js
class ToDo {
    constructor(store) {
        this.store = store;
    }
}

class Parent {
    @observable todos = []
    
    makeTodo() {
      this.todos.push(new ToDo(this));
    }
}
```

Full and complete sample here: https://mobx.js.org/best/store.html

This requires only a simple flatmap to achieve the desired output of a list of all ToDos, but more complicated relationships would easily become more cumbersome. For example, take the following code snippet:

```js
class Step {}

class ToDo {
    @observable steps = [];
    
    makeStep() {
        this.steps.push(new Step(this))
    }

    constructor(store) {
        this.store = store;
    }
}

class Parent {
    @observable todos = []
    
    makeTodo() {
      this.todos.push(new ToDo(this));
    }
}
```
The overall approach is still the same (flatMap with a greater depth to get all Steps from all ToDos), but it would be nice to simply query for all of the steps that currently exist in isolation, or all ofthe ToDos that currently exist without having to traverse the parent contexts.


With this project, I hope to separate the concerns of managing a centralized store with an accessible syntax for describing model relationships and model structure. Eventually I also hope to integrate nice-to-have features, such as index only lookups, complex primary key structures, and relationship cascade options.
</details>
<details>
  <summary><b>Why not mobx-state-tree or other existing libraries instead of developing this solution?</b></summary>
I wanted to tinker a bit with how far I could take this project while punting on features such as state snapshots and state rewinding. I haven't been in a debugging situation where it was helpful for me personally, so MobX-state-tree and others have a bit too much complexity for my taste.
  
All told, this project is about 200 lines of actual code (so far!), with most of the actual code lying in the decorators to set up meta attributes and maintain book-keeping, so it should achieve a very similar result to mobx-state-tree while cutting down on the complexity. LOC isn't a great metric for complexity or scope but it's what I have on hand.  
</details>

<details>
  <summary><b>What is this `__meta__` attribute attatched to my objects?</b></summary>
MobStr needs to maintain records of primary keys names, collection names, and related objects *somewhere*, so shoving them into the added objects was a short-term solution to get up and running. Eventually I hope to separate these meta attributes from the actual models and store that information in the central store in order to avoid any confusion in console.log outputs or object inspection.

As of now, the form that the `__meta__` attribute takes is this:
```js
__meta__: {
    key: IObservableValue<string | symbol | number | null>;

    collectionName: string | symbol | number;
    relationships: Record<
      string | symbol,
      {
        type: any;
        keys: IObservableArray<string>;
        options: Record<string, any>;
      }
    >;
    indicies: IObservableArray<string | symbol | number>;
  };
```
</details>

<details>
  <summary><b>Why decorators?</b></summary>
I previously developed back-end applications in python, so you could say that Flask/SQLAlchemy inspired the initial implementation. Relationship definitions were also inspired by the fantastic TypeORM library. I find that decorators provide a nice semantic over the meaning of the invocation, while staying relatively out of the way for type definitions. This means that in TypeScript, we can "properly" type our model attrbutes to match the mental model of the developer. This does come with some footguns that are unfortunate, which I will call out specifically at a later date.
  
  Example of "proper" typing of class attributes:
  
```ts
class Bar {
    @primaryKey
    id: string = uuid();
}

class Foo {
    @primaryKey
    id: string = uuid();
    
    @relationship(type => Bar)
    friends: Bar[] = [];
}

const f = new Foo();
f.friends[0].id // This properly gives us type hints because we've typed it as a Bar[]. We could have also typed it as an IObservableArray
```
</details>

<details>
  <summary><b>Does this have anything to do with network calls?</b></summary>
At this time, no. There are plenty of ORMs for REST interfaces and GrahQL interfaces that are more feature complete than a hobby project, and I wanted to focus on an area that I felt was lacking in the front-end.
</details>

<details>
  <summary><b>Can I store arbitrary objects without a prototype in the store without defining a model?</b></summary>
Not exactly, at least not yet. I hope to make that a 1.0 feature. However, the likelihood of allowing similar definitions of `relationship` and `primaryKey` is uncertain at this time, due to the need for type names for storage purposes. It's entirely possible that this library could also offer a `collection` wrapper that would allow similar semantics for plain old objects.
 
At this time, the recommended way to use POJOs in this library is similar to this example code:

```js
class Foo {
    @primaryKey
    id = uuid();
    
    @observable
    someProperty = []
}

// returnValue = { status: 200, data: {id: '1234', someProperty: [1, 2, 3, 4] }}
function apiCallResult(returnValue) {
    // Validate
    ...
    // Dump the result into a new instance of the model
    const f = Object.assign(new Foo(), returnValue.data);
    add(f);
    return f;
}

```

</details>
<details>
  <summary><b>Can I have trees?</b></summary>
  Absolutely. The following code ripped out of the test cases works perfectly:
  
  ```js
  class Foo {
    @primaryKey
    id: string = uuid();

    @relationship(store, () => Foo, { cascade: true })
    leaves: Foo[] = [];
  }
  const foo = new Foo();
  const leaves = [new Foo(), new Foo()];
  const otherLeaves = [new Foo(), new Foo()];
  addOne(store, foo);
  foo.leaves.push(...leaves);
  leaves[0].leaves.push(...otherLeaves);
  findAll(Foo).length === 5;
  removeOne(foo);
  findAll(Foo).length === 0;
  ```
  
  However, this does still have the same limitations as POJOs currently do, so you can't *directly* shove a JSON structure into the store, there has to be a preprocessing step. However, a nice side effect of this is the ability to gather all Foo objects in a single query without walking the entirety of the tree.
</details>
<details>
  <summary><b>Can I have complex recursive relationships?</b></summary>
 
  At this time, no. It has a lot to do with when javascript class definitions are evaluated. For an example of what I'm talking about, please reference the below code:
  
  ```js
  class Bar {
    @primaryKey;
    id = uuid()
    
    @relationship(() => Foo)
    foos = [];
  }
  
  class Foo {
    @primaryKey
    id = uuid();
    
    @relationship(() => Bar)
    bars = []
  }
  ```
  
  At class definition time, "Foo" as a type is undefined, so the overall code will fail. I hope to eventually allow for these kinds of structures by using some form of lazy evalutaion on relationship definitions, similar to the method employed by SQLAlchemy.
</details>
<details>
  <summary><b>Does this work with anonymous classes?</b></summary>
 
  No, since the decorator specification doens't allow for usage of decorators within anonymous classes, there's not much that MobStr can do at this time. I hope that in the future we could allow for something like this, since it could open up doors for dynamic model creation, although I'm not sure if that's a great idea or a terrible idea.
</details>
<details>
  <summary><b>Are there column constraints?</b></summary>
  Yes, and they're opt-in by default. MobStr performs no type-checking at runtime since there are plenty of libraries that can validate complex nested schemas, or that can perform complex type checking. However, there are certain store-level constraints that can be checked, such as unique. notUndefined/notNull are included for feature parity with SQL databases. Check constraints can also be user defined, to validate objects in a custom manner as they are populated.
</details>
<details>
  <summary><b>Are there listeners on the store?</b></summary>
  Yes. While MobX provides observer/interceptor support out of the box, MobStr providees syntactic sugar around these interfaces, allowing the store to behave similar to a database. For example, observers/interceptors defined using MobStr's trigger API can discriminate against the type of action being performed (delete, update, add, etc.), leading to a natural and consistent API to map developer intentions against the underlying primitives.
</details>

## Examples
You can find some comprehensive toy examples in tests/integration.test.ts. Below is an example of real-world(ish) example using a fetch to get a company name and the a list of employees from that company.

```js
import { observable, computed } from 'mobx';
import createStore from 'mobstr';

const {
    relationship,
    primaryKey,
    addAll,
    findOne,
    removeOne,
    truncateCollection,
    notNull,
} = createStore();

class Employee {
    @primaryKey
    id = uuid()
}

class Company {
    @primaryKey
    id = uuid()
    
    @notNull
    name;
    
    @observable
    affiliates = []
    
    @relationship(type => Employee)
    employees = [];
    
    @computed
    get employeeIds() { return this.employees.map(employee => employee.id); }
}

async function getAllCompanies(companyIds) {
    const companyData = await Promise.all(
      companyIds.map(companyId => fetch(`/url/for/company/${companyId}`)
    );
    companyData.forEach(company => {
      // Get all of the employee objects from the DB
      const employees = await Promise.all(
        company.employees.map(employee => fetch(`/url/for/company/employee/${employee}`))
      );
      
      // Note that this would overwrite any existing employees with the same ID in the data store, so make sure your IDs are unique!
      company.employees = employees.map(employee => Object.assign(new Employee(), employee))      
    });
    
    return companyData.map(company => Object.assign(new Company(), company));
}

// Top level await for illustrative purposes only
addAll(await getAllCompanies([1, 2, 3, 4))
findOne(Company, 1).employees.push(new Employee());

...
// Maybe we want to show a table of the company in one column with an employee in the other
join(Company, Employees).map((company, employee) => [company.id, employee.id])

...
function destroyCompany(companyId) {
    findOne(Company, companyId).employees = [];
    // If we had cascade: true in our relationship options, we could also delete the company from the store like so:
    // removeOne(findOne(Company, companyId));
}

// Example of a react component to display all companies and with a button to delete all employees for a given company
function ShowAllCompanies(props) {
    const companies = findAll(Company);
    return (
        <div>
            {
                companies.map(company => (
                    <div>
                        <span>{company.name}</span>
                        <button onClick={destroyCompany.bind(null, company.id)}>Destroy {company.name}?</button>
                    </div>
                ))
            }
        </div>
    );
}

```

## Getting Started
This does require decorator support for now, so follow the instructions for enabling babel decorator support here: https://babeljs.io/docs/en/babel-plugin-proposal-decorators

If using TypeScript, enable the "experimentalDecorators" flag in tsconfig.json, instructions located here: https://www.typescriptlang.org/docs/handbook/decorators.html

If using Create-React-App in conjunction with this project and don't wish to eject, please use react-app-rewired to override the babel settings, located here: https://github.com/timarney/react-app-rewired

## Running the tests

This project uses mocha/chai for testing purposes. To invoke, use `npm test` to run the test suite.

## Built With

* [MobX](https://mobx.js.org/getting-started.html)
* [TypeScript](https://www.typescriptlang.org/)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/ducharmemp/mobxt/tags). 

## Authors

* **Matthew DuCharme** - *Initial work* - [My Github](https://github.com/ducharmemp)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

