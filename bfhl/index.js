const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
    const data = req.body.data || [];

    const invalid = [];
    const duplicates = [];
    const seen = new Set();
    const graph = {};
    const parentMap = {};
    const nodes = new Set();

    // Step 1: Validate + duplicates
    data.forEach((edge) => {
        if (!edge || typeof edge !== "string") {
            invalid.push(edge);
            return;
        }

        edge = edge.trim();

        if (!/^[A-Z]->[A-Z]$/.test(edge)) {
            invalid.push(edge);
            return;
        }

        const [p, c] = edge.split("->");

        if (p === c) {
            invalid.push(edge);
            return;
        }

        if (seen.has(edge)) {
            if (!duplicates.includes(edge)) duplicates.push(edge);
            return;
        }

        seen.add(edge);

        // multi-parent check
        if (parentMap[c]) return;

        parentMap[c] = p;

        if (!graph[p]) graph[p] = [];
        graph[p].push(c);

        nodes.add(p);
        nodes.add(c);
    });

    // Step 2: find roots
    const roots = [...nodes].filter(n => !parentMap[n]);

    const visitedGlobal = new Set();
    const hierarchies = [];

    let totalTrees = 0;
    let totalCycles = 0;
    let maxDepth = 0;
    let largestRoot = "";

    function dfs(node, visited, path) {
        if (path.has(node)) return "cycle";

        path.add(node);

        let tree = {};
        let depth = 1;

        if (graph[node]) {
            tree[node] = {};
            for (let child of graph[node]) {
                const res = dfs(child, visited, path);
                if (res === "cycle") return "cycle";

                tree[node][child] = res.tree[child] || {};
                depth = Math.max(depth, 1 + res.depth);
            }
        } else {
            tree[node] = {};
        }

        path.delete(node);
        visited.add(node);

        return { tree, depth };
    }

    // Step 3: process each root
    roots.forEach(root => {
        if (visitedGlobal.has(root)) return;

        const result = dfs(root, visitedGlobal, new Set());

        if (result === "cycle") {
            totalCycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            totalTrees++;

            if (
                result.depth > maxDepth ||
                (result.depth === maxDepth && root < largestRoot)
            ) {
                maxDepth = result.depth;
                largestRoot = root;
            }

            hierarchies.push({
                root,
                tree: result.tree,
                depth: result.depth
            });
        }
    });

    res.json({
        user_id: "sushil_27052004",
        email_id: "sk7493@srmist.edu.in",
        college_roll_number: "RA2311003010393",
        hierarchies,
        invalid_entries: invalid,
        duplicate_edges: duplicates,
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestRoot
        }
    });
});

app.listen(3000, () => console.log("Server running"));