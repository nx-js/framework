# NX

[Home page](http://nx-framework.com), [Docs](http://nx-framework.com/docs)

### NX is a next generation client side framework, built with ES6 and Web Components.

The NX core is a tiny library, responsible for one thing only. It allows you to create and combine components and middlewares. A component executes its middlewares when it is attached to the DOM and gains all the added functionalities from them. NX comes with some core middlewares out of the box, which you can find listed below.

- Text interpolation: Interpolate values from the code into the view dynamically or one-time. Includes optional filters.
- Dynamic and custom attributes: Use one-time or dynamically evaluated native attributes or define some custom ones.
- Event handling: Add inline event handlers to listen on any event. Includes optional rate limiters.
- Visual flow: Use conditional blocks and loops inside the HTML view.
- Data binding: One-way, one-time or two-way data binding on any event and with no edge cases.
- Rendering: Modularize your HTML and CSS code by moving them into separate files for each component.
- Routing: Simple, but powerful routing with automatic parameter synchronization and router events.
- Dynamic styling: Simplify styling by passing objects to the style and class attributes.
- Animations: Create powerful animations by using only a few HTML attributes.
- Some other low level middlewares, mentioned in the Docs.
- Anything else you define with the simple `function middleware (elem, state, next) {}` syntax.

These can be combined to create components with the desired functionality.
Alternatively ready made core components (app, router) can be extended and used,
to avoid boilerplate code.

## Example app

The [NX Hacker News demo](https://github.com/nx-hacker-news/nx-hacker-news.github.io)
features client-side routing, real-time updates and animations.

- The code: https://github.com/nx-hacker-news/nx-hacker-news.github.io
- The live demo: https://nx-hacker-news.github.io/?type=top&page=0

## Resources

- [NX Docs](http://nx-framework.com/docs)
- [Hacker News in NX](https://github.com/nx-hacker-news/nx-hacker-news.github.io)
- [NX TodoMVC](https://github.com/tastejs/todomvc/pull/1679/files)
- [Article series about writing NX](https://blog.risingstack.com/writing-a-javascript-framework-project-structuring/)

## Installation

The best option is to download NX from the [download page](http://nx-framework.com/download).
If you would like to get it from npm instead, use the `npm install @risingstack/nx-framework` command.

## Contributing

[List of contributors](/contributors.md)

If you have a new feature idea, just open a new issue or PR.
Bug fixes and tests are always welcome. Thanks!
