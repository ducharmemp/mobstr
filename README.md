# MobXT

MobXT is a project designed to provide an ORM-like interface to a MobX store. The goal of this project is to achieve a low-overhead, normalized approach to modeling to allow developers to focus on domain modeling without having to deal with manual bookkeeping of object relationships.

While developing projects, I found myself maintaining more bookkeepping maps and objects than I enjoyed, and had to remember to invalidate certain relationships with objects to avoid having dangling references to objects within the maps. I also disliked the overall method that I had to use to find the related objects. Too often I find myself accidentally slipping in attributes that are meant to achieve faster performance for lookup to my store objects. This works for a time, but then my model becomes polluted with extra attributes that I need to keep in sync and the model deviates further from my actual intention.

With this project, I hope to separate the concerns of managing a centralized store with an accessible syntax for describing model relationships and model structure. Eventually I also hope to integrate nice-to-have features, such as index only lookups, complex primary key structures, and relationship cascades.

## Why not mobx-state-tree instead of developing this solution?
I wanted to tinker a bit with how far I could take this project while punting on features such as state snapshots and state rewinding. I haven't been in a debugging situation where it was helpful for me personally so MobX-state-tree has a bit too much complexity for my taste. All told, this project is about 100 lines of actual code (so far!), with most of the actual code lying in the decorators to set up meta attributes and maintain bookkeeping, so it should achieve a very similar result to mobx-state-tree while cutting down on the complexity.

## What is this __meta__ attribute attatched to my objects?
MobXT needs to maintain records of primary keys names, collection names, and related objects *somewhere*, so shoving them into the added objects was a short-term solution to get up and running. Eventually I hope to separate these meta attributes from the actual models and store that information in the central store in order to avoid any confusion in console.log outputs or object inspection.

## Why decorators?
I originally developed a lot in python, and Flask/SQLAlchemy inspired the initial implementation. Relationship definitions were also inspired by the fantastic TypeORM library. I find that decorators provide a nice semantic over the meaning of the invocation, while staying relatively out of the way for type definitions. This means that in TypeScript, we can "properly" type our model attrbutes to match the mental model of the developer. This does come with some footguns that are unfortunate, which I will call out specifically at a later date.

## Does this have anything to do with network calls?
At this time, no. There are plenty of ORMs for REST interfaces and GrahQL interfaces that are more feature complete than a hobby project, and I wanted to focus on an area that I felt was lacking in the front-end.

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

