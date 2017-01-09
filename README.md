# The NX framework

[Home page](http://nx-framework.com), [Docs](http://nx-framework.com/docs)

**NX is a modular front-end framework - built with ES6 and Web Components. The building
blocks of NX are the core, the middlewares, the components and the utilities. These are
all hosted in separate GitHub repos and npm packages.**

The NX core is a tiny library, responsible for one thing only. It allows you to create dumb components and to augment them with middlewares. A component executes its middlewares when it is attached to the DOM and it gains all the extra functionalities from them. NX comes with some core middlewares out of the box, which you can find listed below.

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
Alternatively ready made core components can be extended and used,
to avoid boilerplate code.

## Resources

- [Home page](http://nx-framework.com/)
- [Docs](http://nx-framework.com/docs)
- [Intro app](https://github.com/nx-js/intro-example)
- [TodoMVC](https://github.com/nx-js/todomvc-example)
- [Hacker News clone](https://github.com/nx-js/hackernews-example)
- [Blog](http://nx-framework.com/blog/public)
- [Article series about writing NX](https://blog.risingstack.com/writing-a-javascript-framework-project-structuring/)

## Installation

You can get NX from npm with the `npm install @nx-js/framework` command. See the
[installation page](http://nx-framework.com/install) for other options.

## Local development

You can bundle the framework locally with the `npm run build` command and minify it
with the `npm run minify` command. The bundled and minified files are placed in the
`lib` folder.

## Contributing

[A list of contributors](/contributors.md)

NX is very modular and every module is hosted in its own GitHub repository. Please
open the issues and PRs in the relevant repositories. For example: if you have a feature
request for routing, open a new issue in the
[route-middleware](https://github.com/nx-js/route-middleware) repo.

Thanks!
