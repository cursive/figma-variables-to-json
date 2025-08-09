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

// Function to get variable type for component variant
function getVariableType(resolvedType) {
    switch (resolvedType) {
        case 'COLOR': return 'color';
        case 'FLOAT': return 'number';
        case 'STRING': return 'string';
        case 'BOOLEAN': return 'boolean';
        default: return 'string';
    }
}

// Function to create visual representation
async function createVisualRepresentation(variablesData) {
    console.log("Creating visual representation...");

    // Spacing variables
    const collectionsPadding = 25;
    const collectionsGap = 5;
    const collectionGap = 10;
    const modesGap = 15;
    const modeGap = 20;
    const modePaddingLeft = 25;

    // Load Figma's default font (needed when modifying text content)
    try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        console.log("Inter Regular font loaded successfully");
    } catch (error) {
        console.log("Font loading error:", error);
        figma.notify("Error: Could not load default font.");
        return;
    }

    // Create a new frame instead of using existing visual frame
    console.log(`Creating new visual frame...`);
    const collectionsFrame = figma.createFrame();
    collectionsFrame.name = 'collections';
    collectionsFrame.layoutMode = "HORIZONTAL";
    collectionsFrame.itemSpacing = collectionsGap;
    collectionsFrame.clipsContent = false;
    // Hug contents on primary axis, fill counter axis for equal heights
    collectionsFrame.primaryAxisSizingMode = "AUTO";
    collectionsFrame.counterAxisSizingMode = "AUTO";

    console.log(`✅ Created new visual frame: ${collectionsFrame.name} (${collectionsFrame.type})`);
    console.log(`- Visual frame children count: ${collectionsFrame.children.length}`);
    console.log(`- Visual frame layout mode: ${collectionsFrame.layoutMode}`);

    // Find the heading components
    const headingCollectionComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'heading-collection'
    );
    const headingModeComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'heading-mode'
    );
    const headingGroupComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'heading-group'
    );
    const colorComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'variable-color'
    );
    const numberComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'variable-number'
    );
    const stringComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'variable-string'
    );
    const booleanComponent = figma.currentPage.findOne(node =>
        node.type === 'COMPONENT' && node.name === 'variable-boolean'
    );

    // Debug: Log all components on the current page
    console.log("All components on current page:");
    figma.currentPage.findAll(node => node.type === 'COMPONENT').forEach(comp => {
        console.log(`- ${comp.name} (${comp.type})`);
    });

    // Error handling for missing components
    if (!headingCollectionComponent || !headingModeComponent || !headingGroupComponent) {
        figma.notify('Error: One or more heading components not found (heading-collection, heading-mode, heading-group)');
        return;
    }
    if (!colorComponent || !numberComponent || !stringComponent || !booleanComponent) {
        figma.notify('Error: One or more variable type components not found. Please check component names.');
        return;
    }

    // Clear existing content in visual frame
    collectionsFrame.children.forEach(child => child.remove());

    // Set up visual frame properties
    collectionsFrame.layoutMode = "HORIZONTAL";
    collectionsFrame.itemSpacing = collectionsGap;
    collectionsFrame.clipsContent = false;

    // Process all variables with headers and category frames
    const collectionFrames = []; // Collect frames for equal height adjustment
    for (const [collectionName, collectionData] of Object.entries(variablesData)) {
        // Create collection frame
        const collectionFrame = figma.createFrame();
        collectionFrame.name = 'collection';
        collectionFrame.layoutMode = "HORIZONTAL";
        collectionFrame.itemSpacing = collectionGap;
        collectionFrame.paddingLeft = collectionsPadding;
        collectionFrame.paddingTop = collectionsPadding;
        collectionFrame.paddingRight = collectionsPadding;
        collectionFrame.paddingBottom = collectionsPadding;
        collectionFrame.clipsContent = false;
        collectionFrame.primaryAxisSizingMode = "AUTO";
        collectionFrame.counterAxisSizingMode = "AUTO";
        // Add left black stroke
        collectionFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
        collectionFrame.strokeWeight = 5;
        collectionFrame.strokeAlign = "INSIDE";
        collectionFrame.strokeTopWeight = 0;
        collectionFrame.strokeRightWeight = 0;
        collectionFrame.strokeBottomWeight = 0;
        collectionFrame.strokeLeftWeight = 5;
        collectionsFrame.appendChild(collectionFrame);

        // Add to collection for equal height adjustment
        collectionFrames.push(collectionFrame);

        // Create collection heading
        const collectionHeading = headingCollectionComponent.createInstance();

        // Find and populate collection heading text elements
        const collectionTitleElement = collectionHeading.findOne(node => node.name === 'title');
        const collectionNameElement = collectionHeading.findOne(node => node.name === 'name');

        if (collectionTitleElement && collectionTitleElement.type === 'TEXT') {
            collectionTitleElement.characters = 'Collection';
        }
        if (collectionNameElement && collectionNameElement.type === 'TEXT') {
            collectionNameElement.characters = collectionName;
        }

        // Add collection heading to collection frame
        collectionFrame.appendChild(collectionHeading);

        // Create a horizontal modes container inside collection
        const modesContainer = figma.createFrame();
        modesContainer.name = 'modes';
        modesContainer.layoutMode = "HORIZONTAL";
        modesContainer.itemSpacing = modesGap;
        modesContainer.clipsContent = false;
        modesContainer.primaryAxisSizingMode = "AUTO";
        modesContainer.counterAxisSizingMode = "AUTO";
        collectionFrame.appendChild(modesContainer);

        for (const [modeName, modeData] of Object.entries(collectionData)) {
            // Create mode frame
            const modeFrame = figma.createFrame();
            modeFrame.name = 'mode';
            modeFrame.layoutMode = "VERTICAL";
            modeFrame.itemSpacing = modeGap;
            modeFrame.paddingLeft = modePaddingLeft;
            modeFrame.clipsContent = false;
            modeFrame.primaryAxisSizingMode = "AUTO";
            modeFrame.counterAxisSizingMode = "AUTO";
            // Add left stroke
            modeFrame.strokes = [{ type: 'SOLID', color: { r: 0.867, g: 0.867, b: 0.867 } }];
            modeFrame.strokeWeight = 1;
            modeFrame.strokeAlign = "INSIDE";
            modeFrame.strokeTopWeight = 0;
            modeFrame.strokeRightWeight = 0;
            modeFrame.strokeBottomWeight = 0;
            modeFrame.strokeLeftWeight = 1;
            modesContainer.appendChild(modeFrame);

            // Create mode heading
            const modeHeading = headingModeComponent.createInstance();

            // Find and populate mode heading text elements
            const modeTitleElement = modeHeading.findOne(node => node.name === 'title');
            const modeNameElement = modeHeading.findOne(node => node.name === 'name');

            if (modeTitleElement && modeTitleElement.type === 'TEXT') {
                modeTitleElement.characters = 'Mode';
            }
            if (modeNameElement && modeNameElement.type === 'TEXT') {
                modeNameElement.characters = modeName;
            }

            // Add mode heading to mode frame
            modeFrame.appendChild(modeHeading);

            for (const [groupName, groupData] of Object.entries(modeData)) {
                // Create group frame
                const groupFrame = figma.createFrame();
                groupFrame.name = 'group';
                groupFrame.layoutMode = "VERTICAL";
                groupFrame.clipsContent = false;
                groupFrame.primaryAxisSizingMode = "AUTO";
                groupFrame.counterAxisSizingMode = "AUTO";
                modeFrame.appendChild(groupFrame);

                // Create group heading
                const groupHeading = headingGroupComponent.createInstance();

                // Find and populate group heading text elements
                const groupTitleElement = groupHeading.findOne(node => node.name === 'title');
                const groupNameElement = groupHeading.findOne(node => node.name === 'name');

                if (groupTitleElement && groupTitleElement.type === 'TEXT') {
                    groupTitleElement.characters = 'Group';
                }
                if (groupNameElement && groupNameElement.type === 'TEXT') {
                    groupNameElement.characters = groupName;
                }

                // Add group heading to group frame
                groupFrame.appendChild(groupHeading);

                for (const [variableName, variableData] of Object.entries(groupData)) {
                    const variableValue = variableData.value;
                    const variableType = variableData.type;

                    // Determine variable type and select appropriate component based on original type
                    let variableComponent;
                    switch (variableType) {
                        case 'COLOR':
                            variableComponent = colorComponent;
                            break;
                        case 'FLOAT':
                            variableComponent = numberComponent;
                            break;
                        case 'STRING':
                            variableComponent = stringComponent;
                            break;
                        case 'BOOLEAN':
                            variableComponent = booleanComponent;
                            break;
                        default:
                            // Fallback to old logic for unknown types
                            if (typeof variableValue === 'string' && variableValue.startsWith('#')) {
                                variableComponent = colorComponent;
                            } else if (typeof variableValue === 'number') {
                                variableComponent = numberComponent;
                            } else if (typeof variableValue === 'boolean') {
                                variableComponent = booleanComponent;
                            } else if (typeof variableValue === 'string' && (variableValue === 'true' || variableValue === 'false')) {
                                variableComponent = booleanComponent;
                            } else {
                                variableComponent = stringComponent;
                            }
                    }

                    // Create variable instance
                    console.log(`Creating variable instance for: ${variableName} = ${variableValue}`);
                    console.log(`- Using component: ${variableComponent.name}`);

                    const variableInstance = variableComponent.createInstance();
                    console.log(`✅ Created variable instance: ${variableInstance.name} (${variableInstance.type})`);

                    // Set up variable auto-layout
                    variableInstance.layoutMode = "HORIZONTAL";

                    // Find and populate variable text elements (now within 'content' layer)
                    const contentLayer = variableInstance.findOne(node => node.name === 'content');
                    const variableNameElement = contentLayer ? contentLayer.findOne(node => node.name === 'name') : variableInstance.findOne(node => node.name === 'name');
                    const variableValueElement = contentLayer ? contentLayer.findOne(node => node.name === 'value') : variableInstance.findOne(node => node.name === 'value');
                    const visualSwatch = contentLayer ? contentLayer.findOne(node => node.name === 'visual') : variableInstance.findOne(node => node.name === 'visual');

                    if (variableNameElement && variableNameElement.type === 'TEXT') {
                        variableNameElement.characters = variableName;
                    }
                    if (variableValueElement && variableValueElement.type === 'TEXT') {
                        variableValueElement.characters = String(variableValue);
                    }

                    // If this is a color variable and we have a visual swatch, set its fill
                    if (visualSwatch && variableType === 'COLOR') {
                        try {
                            if (typeof variableValue === 'string' && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(variableValue)) {
                                // Direct hex color value
                                const hex = variableValue.replace('#', '');
                                const r = parseInt(hex.substring(0, 2), 16) / 255;
                                const g = parseInt(hex.substring(2, 4), 16) / 255;
                                const b = parseInt(hex.substring(4, 6), 16) / 255;
                                const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
                                if ('fills' in visualSwatch) {
                                    visualSwatch.fills = [{ type: 'SOLID', color: { r, g, b }, opacity: a }];
                                }
                            } else {
                                // Referenced color - set a placeholder color to indicate it's a reference
                                if ('fills' in visualSwatch) {
                                    visualSwatch.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 }];
                                }
                            }
                        } catch (e) {
                            console.log('Failed setting color swatch for', variableName, variableValue, e);
                        }
                    }

                    // Add variable to group frame
                    console.log(`About to append variable instance to group frame:`);
                    console.log(`- Variable instance type: ${variableInstance.type}`);
                    console.log(`- Variable instance name: ${variableInstance.name}`);
                    console.log(`- Group frame type: ${groupFrame.type}`);
                    console.log(`- Group frame name: ${groupFrame.name}`);
                    console.log(`- Group frame children count: ${groupFrame.children.length}`);

                    try {
                        groupFrame.appendChild(variableInstance);
                        console.log(`✅ Successfully appended variable instance`);
                    } catch (error) {
                        console.log(`❌ Error appending variable instance:`, error);
                        throw error;
                    }
                }
            }
        }
    }

    // Make all collection frames the same height (equal to the tallest one)
    if (collectionFrames.length > 1) {
        const maxHeight = Math.max(...collectionFrames.map(frame => frame.height));
        console.log(`Adjusting collection frames to equal height: ${maxHeight}px`);

        collectionFrames.forEach(frame => {
            frame.resize(frame.width, maxHeight);
        });
    }

    console.log("Visual representation created successfully!");
    figma.notify('Visual representation created successfully!');

    // Send message to UI to reset the button
    figma.ui.postMessage({
        type: 'visual-generated'
    });
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

                // Set the variable value and type
                json[collectionName][camelCaseModeName][groupName][variableName] = {
                    value: value,
                    type: variable.resolvedType
                };
            }
        } else {
            // Fallback for variables without proper hierarchy
            const key = toCamelCase(variable.name);
            json[key] = {
                value: value,
                type: variable.resolvedType
            };
        }
    }

    // Sort only the collections alphabetically
    const sortedJson = sortCollectionsOnly(json);

    // Convert back to value-only structure for JSON output
    const jsonForOutput = {};
    for (const [collectionName, collectionData] of Object.entries(sortedJson)) {
        jsonForOutput[collectionName] = {};
        for (const [modeName, modeData] of Object.entries(collectionData)) {
            jsonForOutput[collectionName][modeName] = {};
            for (const [groupName, groupData] of Object.entries(modeData)) {
                jsonForOutput[collectionName][modeName][groupName] = {};
                for (const [variableName, variableData] of Object.entries(groupData)) {
                    jsonForOutput[collectionName][modeName][groupName][variableName] = variableData.value || variableData;
                }
            }
        }
    }

    console.log("Final JSON:", jsonForOutput);

    const jsonString = JSON.stringify(jsonForOutput, null, 2);

    // Send the JSON to the UI
    figma.ui.postMessage({
        type: 'json-output',
        json: jsonString
    });

    console.log("JSON sent to UI");
}

// Function to create visual representation directly from variables (independent of JSON generation)
async function createVisualRepresentationDirect() {
    console.log("Creating visual representation directly from variables...");

    // Process variables to get the data structure
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

                // Set the variable value and type
                json[collectionName][camelCaseModeName][groupName][variableName] = {
                    value: value,
                    type: variable.resolvedType
                };
            }
        } else {
            // Fallback for variables without proper hierarchy
            const key = toCamelCase(variable.name);
            json[key] = {
                value: value,
                type: variable.resolvedType
            };
        }
    }

    // Sort only the collections alphabetically
    const sortedJson = sortCollectionsOnly(json);

    // Now create the visual representation
    await createVisualRepresentation(sortedJson);
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
        } else if (msg.type === 'generate-visual') {
            // Generate visual representation directly from variables (independent of JSON generation)
            await createVisualRepresentationDirect();
        }
    };
}

main();
