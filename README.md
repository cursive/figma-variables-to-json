# Figma Variables to JSON Converter

A Figma plugin that converts design variables into a structured JSON format with proper hierarchy and camelCase naming.

## Features

- **4-Level Hierarchy**: Collection → Mode → Group → Variable
- **Variable Reference Resolution**: Automatically resolves variable references to their full paths
- **Color Conversion**: Converts Figma colors to hex format
- **CamelCase Naming**: Converts all names to proper camelCase format
- **Alphabetical Sorting**: Collections are sorted alphabetically for consistency
- **UI Interface**: Clean interface with copy-to-clipboard functionality

## Installation

1. Clone this repository
2. Open the project in your code editor
3. In Figma, go to Plugins → Development → Import plugin from manifest
4. Select the `manifest.json` file from this project

## Usage

1. Open the plugin in Figma
2. Click "Run Plugin" to process your variables
3. The JSON output will appear in the interface
4. Click "Copy to Clipboard" to copy the JSON

## Output Structure

The plugin creates a JSON structure like this:

```json
{
  "colorsCollection": {
    "light": {
      "background": {
        "basePrimary": "#ffffff",
        "baseSecondary": "#f5f5f5",
        "accent": "hues/accent"
      },
      "foreground": {
        "basePrimary": "#141414",
        "baseSecondary": "#00000099",
        "accent": "hues/accent"
      }
    },
    "dark": {
      "background": {
        "basePrimary": "#000000",
        "baseSecondary": "#1a1a1a",
        "accent": "hues/accent"
      }
    }
  },
  "layout": {
    "mobile": {
      "spacing": {
        "panelLrbPadding": 12,
        "verticalGutter": 0
      }
    },
    "desktop": {
      "spacing": {
        "panelLrbPadding": 24,
        "verticalGutter": 12
      }
    }
  }
}
```

## How It Works

1. **Collection Level**: Groups variables by their collection (e.g., "Colors collection", "Layout")
2. **Mode Level**: Separates variables by their modes (e.g., "light"/"dark", "mobile"/"desktop")
3. **Group Level**: Organizes variables by their groups (e.g., "background", "foreground", "spacing")
4. **Variable Level**: Individual variables with their values

## Variable Types Supported

- **Colors**: Converted to hex format (#ffffff)
- **Numbers**: Preserved as-is
- **Strings**: Preserved as-is
- **Booleans**: Preserved as-is
- **References**: Resolved to full variable paths (e.g., "hues/accent")

## Naming Conventions

- **Collections**: camelCase with lowercase first letter (e.g., "Colors collection" → `colorsCollection`)
- **Modes**: camelCase (e.g., "Mobile" → `mobile`, "light" → `light`)
- **Groups**: camelCase (e.g., "background" → `background`)
- **Variables**: camelCase (e.g., "base primary" → `basePrimary`)

## Development

### Project Structure

```
├── manifest.json    # Figma plugin manifest
├── code.js         # Main plugin logic
├── ui.html         # Plugin UI interface
└── README.md       # This file
```

### Building

This plugin is written in vanilla JavaScript and doesn't require a build step. Simply:

1. Edit the files as needed
2. Reload the plugin in Figma (Plugins → Development → Reload)

### Key Functions

- `toCamelCase()`: Converts strings to camelCase format
- `processVariables()`: Main processing logic
- `sortCollectionsOnly()`: Sorts only collection names alphabetically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this plugin in your projects!

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
