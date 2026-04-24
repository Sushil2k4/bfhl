const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
    const input = req.body.data || [];

    const invalid = [];
    const duplicates = [];
    const seen = new Set();

    const adjacencyList = {};
    const parentOf = {};
    const allNodes = new Set();

    input.forEach((item) => {
        if (!item || typeof item !== "string") {
            invalid.push(item);
            return;
        }

        const edge = item.trim();

        if (!/^[A-Z]->[A-Z]$/.test(edge)) {
            invalid.push(edge);
            return;
        }

        const [parent, child] = edge.split("->");

        if (parent === child) {
            invalid.push(edge);
            return;
        }

        if (seen.has(edge)) {
            if (!duplicates.includes(edge)) duplicates.push(edge);
            return;
        }

        seen.add(edge);

        if (parentOf[child]) return;

        parentOf[child] = parent;

        if (!adjacencyList[parent]) adjacencyList[parent] = [];
        adjacencyList[parent].push(child);

        allNodes.add(parent);
        allNodes.add(child);
    });

    const roots = [...allNodes].filter(n => !parentOf[n]);

    const visited = new Set();
    const result = [];

    let treeCount = 0;
    let cycleCount = 0;
    let bestDepth = 0;
    let bestRoot = "";

    function explore(node, stack) {
        if (stack.has(node)) return "cycle";

        stack.add(node);

        let structure = {};
        let depth = 1;

        if (adjacencyList[node]) {
            structure[node] = {};
            for (let next of adjacencyList[node]) {
                const check = explore(next, stack);
                if (check === "cycle") return "cycle";

                structure[node][next] = check.tree[next] || {};
                depth = Math.max(depth, 1 + check.depth);
            }
        } else {
            structure[node] = {};
        }

        stack.delete(node);
        visited.add(node);

        return { tree: structure, depth };
    }

    roots.forEach(root => {
        if (visited.has(root)) return;

        const output = explore(root, new Set());

        if (output === "cycle") {
            cycleCount++;
            result.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            treeCount++;

            if (
                output.depth > bestDepth ||
                (output.depth === bestDepth && root < bestRoot)
            ) {
                bestDepth = output.depth;
                bestRoot = root;
            }

            result.push({
                root,
                tree: output.tree,
                depth: output.depth
            });
        }
    });

    res.json({
        user_id: "sushil_27052004",
        email_id: "sk7493@srmist.edu.in",
        college_roll_number: "RA2311003010393",
        hierarchies: result,
        invalid_entries: invalid,
        duplicate_edges: duplicates,
        summary: {
            total_trees: treeCount,
            total_cycles: cycleCount,
            largest_tree_root: bestRoot
        }
    });
});

app.listen(3000);