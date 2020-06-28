# :sparkles: stylishc :sparkles:

Create stylish contributors badges with ease!

## Available via...

### :computer: Command Line

#### Install

```shell
npm install -g @devlife-apps/stylishc-cli
```

#### Usage

##### Options

```text
stylishc [command]

Commands:
  stylishc contributors <repo>  Generate an image of the contributors for given
                                repository.
  stylishc users <username...>  Generate an image including only the provided
                                users.

Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --avatar-padding  Avatar padding.                       [number] [default: 10]
  --avatar-size     Avatar size.                          [number] [default: 50]
  --avatar-radius   Avatar corner radius.                 [number] [default: 50]
  --canvas-color    Canvas color.                    [string] [default: "#FFF0"]
  --canvas-width    Canvas width.                        [number] [default: 900]
  --stroke-color    Stroke color.                    [array] [default: ["#CCC"]]
  --stroke-width    Stroke width.                          [number] [default: 2]
  --limit           Limit number of users. (max 100)     [number] [default: 100]
  --style, -s       Style JSON file. (overrides any provided args)      [string]
  --output, -o      Output file.          [string] [default: "contributors.png"]
```

##### Example

```shell
stylishc contributors devlife-apps/stylishc
```

### Web

```text

```

## Contributors

[![contributors](contributors.png)](https://github.com/devlife-apps/stylishc/graphs/contributors)

## Examples

Check out more stylishc [examples](examples/README.md).

## Roadmap

- [x] [Command line](#computer-command-line) - A CLI to run on your computer.
- [ ] HTTP service - A HTTP service you can host anywhere.
- [ ] Hosted instance - A hosted instance of the HTTP service.
- [ ] Google Cloud Run Button - Your own instance on GCP
- [ ] Deploy to Heroku Button - Your own instance on Heroku
