const report = {};
const cellColors = {};

const unzip = async (uuid) => {
    const zipper = new JSZip();
    const response = await fetch('/download/' + uuid + '.zip');
    const blob = await response.blob();
    const result = await zipper.loadAsync(blob)
    return result;
}

const createBranchPoints = (curve) => {
    const curvePoints = [];
    const midpoint = curve.xyz[Math.floor(curve.xyz.length / 2)];
    const labelEntity = document.createElement("a-entity");
    const textValue = `value: ${curve.branch_id}; color:black; align: center; side: double; width: 6`;
    labelEntity.setAttribute("text", textValue);
    const labelPosition = `${midpoint.x * 100} ${midpoint.y * 100} ${midpoint.z * 100}`;
    labelEntity.setAttribute("position", labelPosition);
    labelEntity.setAttribute("billboard", "");
    labelEntity.className = curve.branch_id;
    labelEntity.addEventListener('click', () => {
        currentBranch = curve.branch_id;
    })
    const curveLabels = document.getElementById('curve-labels');
    curveLabels.appendChild(labelEntity);
    curve.xyz.forEach((coord, _) => {
        const curvePoint = `<a-curve-point position="${coord.x * 100} ${coord.y * 100} ${coord.z * 100}"></a-curve-point>`;
        curvePoints.push(curvePoint);
    });
    return curvePoints;
}

const createCurveEnities = (branches) => {
    const branch_els = [];
    const branch_draw_els = [];
    branches.forEach((branch, _) => {
        const branch_el = `<a-curve id="${branch}" ></a-curve>`;
        branch_els.push(branch_el);
        const branch_draw_el = `<a-draw-curve cursor-listener curveref="#${branch}" material="shader: line; color: blue;" geometry="primitive: " ></a-draw-curve>`;
        branch_draw_els.push(branch_draw_el);
    });
    return [branch_els, branch_draw_els];
}

const setDrawContainerContent = (branch_els, branch_draw_els) => {
    const branch_container_el = document.getElementById("curve-container");
    branch_container_el.innerHTML = branch_els.join(" ");
    const branch_draw_container = document.getElementById("curve-draw");
    branch_draw_container.innerHTML = branch_draw_els.join(" ");
}

const renderStreamCells = async (cells) => {
    const cell_el = document.getElementById("cells");
    const cellEntities = [];
    cells.forEach((cell_point, _) => {
        const stream_cell = `<a-sphere id="${cell_point.cell_id}" position="${cell_point.x * 100} ${cell_point.y * 100} ${cell_point.z * 100}" color="${cellColors[cell_point.cell_id]}" radius=".05" shadow></a-sphere>`;
        cellEntities.push(stream_cell);
    });
    cell_el.innerHTML = cellEntities.join(" ");
}

const renderStream = async (curves, cells, metadata) => {
    const branches = [];
    curves.forEach((coord, _) => {
        if (!branches.includes(coord.branch_id)) {
            branches.push(coord.branch_id);
        }
    });

    const [branch_els, branch_draw_els] = createCurveEnities(branches);

    setDrawContainerContent(branch_els, branch_draw_els);

    curves.forEach((curve) => {
        const points = createBranchPoints(curve);
        const branch_el = document.getElementById(curve.branch_id);
        branch_el.innerHTML = points.join(" ")
    })

    metadata.forEach((cell) => {
        cellColors[cell.cell_id] = cell.label_color;
    });

    renderStreamCells(cells);
}

const initialize = async (uuid) => {
    const result = await unzip(uuid);
    report = result;
    const streamFile = await result.file("stream.json").async("string");
    const scatterFile = await result.file("scatter.json").async("string");
    const metadataFile = await result.file("metadata.json").async("string");
    renderStream(JSON.parse(streamFile), JSON.parse(scatterFile), JSON.parse(metadataFile));
  }
  
  window.onload = () => {
    const uuid = window.location.href.split("/").slice(-1)[0];
    initialize(uuid);
  }