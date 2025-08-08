"use strict";
function toCamelCase(str) {
    if (!str) return '';
    // Convert to camelCase and ensure first letter is lowercase
    return str.replace(/[- ]([a-z])/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase());
}

function setNested(obj, path, value) {
    if (!path || path.length === 0) return;

    const key = toCamelCase(path[0]);
    if (path.length === 1) {
        obj[key] = value;
        return;
    }
    obj[key] = obj[key] || {};
    setNested(obj[key], path.slice(1), value);
}

// Function to sort only collection keys alphabetically
function sortCollectionsOnly(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj;
    }

    const sortedObj = {};
    Object.keys(obj).sort().forEach(key => {
        // Only sort the top level (collections), keep everything else in original order
        sortedObj[key] = obj[key];
    });

    return sortedObj;
}

async function processVariables() {
    console.log("Plugin started");

    const variables = await figma.variables.getLocalVariablesAsync();
    console.log(`Found ${variables.length} variables`);

    // Build a map of all variables with their IDs
    const variableMap = new Map();
    for (const variable of variables) {
        variableMap.set(variable.id, variable);
    }

    const json = {};

    for (const variable of variables) {
        // Get the collection information
        let collection;
        try {
            collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
        } catch (error) {
            collection = null;
        }

        // Split the variable name to get the group and variable name
        let pathParts;
        if (variable.name.includes("/")) {
            pathParts = variable.name.split("/");
        } else {
            const parts = variable.name.split(" ");
            if (parts.length >= 2) {
                const group = parts[0];
                const variableName = parts.slice(1).join(" ");
                pathParts = [group, variableName];
            } else {
                pathParts = [variable.name];
            }
        }

        // Create the four-level hierarchy: Collection / Mode / Group / Variable
        if (collection && pathParts.length > 1) {
            const collectionName = toCamelCase(collection.name);
            const groupName = toCamelCase(pathParts[0]);
            const variableName = toCamelCase(pathParts.slice(1).join(" "));

            // Initialize collection if it doesn't exist
            if (!json[collectionName]) {
                json[collectionName] = {};
            }

            // Process ALL modes for this variable
            for (const [modeId, val] of Object.entries(variable.valuesByMode)) {
                // Get the mode name from the collection's modes
                const mode = collection.modes.find(m => m.modeId === modeId);
                const modeName = mode ? mode.name : modeId;
                const camelCaseModeName = toCamelCase(modeName);

                let value;

                // Check if this variable references another variable
                if (variable.remote && variable.remote.id) {
                    const refVar = variableMap.get(variable.remote.id);
                    if (refVar) {
                        // Apply camelCase to the referenced variable name
                        const refPathParts = refVar.name.includes("/") ?
                            refVar.name.split("/") :
                            [refVar.name.split(" ")[0], refVar.name.split(" ").slice(1).join(" ")];
                        const refGroup = toCamelCase(refPathParts[0]);
                        const refVariable = toCamelCase(refPathParts.slice(1).join(" "));
                        value = `${refGroup}/${refVariable}`;
                    } else {
                        value = variable.remote.id;
                    }
                } else if (typeof val === 'string') {
                    const refVar = variableMap.get(val);
                    if (refVar) {
                        // Apply camelCase to the referenced variable name
                        const refPathParts = refVar.name.includes("/") ?
                            refVar.name.split("/") :
                            [refVar.name.split(" ")[0], refVar.name.split(" ").slice(1).join(" ")];
                        const refGroup = toCamelCase(refPathParts[0]);
                        const refVariable = toCamelCase(refPathParts.slice(1).join(" "));
                        value = `${refGroup}/${refVariable}`;
                    } else {
                        value = val;
                    }
                } else if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
                    const refVar = variableMap.get(val.id);
                    if (refVar) {
                        // Apply camelCase to the referenced variable name
                        const refPathParts = refVar.name.includes("/") ?
                            refVar.name.split("/") :
                            [refVar.name.split(" ")[0], refVar.name.split(" ").slice(1).join(" ")];
                        const refGroup = toCamelCase(refPathParts[0]);
                        const refVariable = toCamelCase(refPathParts.slice(1).join(" "));
                        value = `${refGroup}/${refVariable}`;
                    } else {
                        value = val.id;
                    }
                } else {
                    // Handle different variable types based on resolvedType
                    switch (variable.resolvedType) {
                        case 'COLOR':
                            const { r, g, b, a } = val;
                            value = `#${[r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`;
                            break;
                        case 'FLOAT':
                            value = val;
                            break;
                        case 'STRING':
                            value = val;
                            break;
                        case 'BOOLEAN':
                            value = val;
                            break;
                        default:
                            value = val;
                    }
                }

                // Initialize mode if it doesn't exist
                if (!json[collectionName][camelCaseModeName]) {
                    json[collectionName][camelCaseModeName] = {};
                }

                // Initialize group if it doesn't exist
                if (!json[collectionName][camelCaseModeName][groupName]) {
                    json[collectionName][camelCaseModeName][groupName] = {};
                }

                // Set the variable value
                json[collectionName][camelCaseModeName][groupName][variableName] = value;
            }
        } else {
            // Fallback for variables without proper hierarchy
            const key = toCamelCase(variable.name);
            json[key] = value;
        }
    }

    // Sort only the collections alphabetically
    const sortedJson = sortCollectionsOnly(json);

    console.log("Final JSON:", sortedJson);

    const jsonString = JSON.stringify(sortedJson, null, 2);

    // Send the JSON to the UI
    figma.ui.postMessage({
        type: 'json-output',
        json: jsonString
    });

    console.log("JSON sent to UI");
}

async function main() {
    // Show the UI with larger size
    figma.showUI(__html__, {
        width: 600,
        height: 700
    });

    // Listen for messages from the UI
    figma.ui.onmessage = async (msg) => {
        if (msg.type === 'run-plugin') {
            await processVariables();
        }
    };
}

main();
