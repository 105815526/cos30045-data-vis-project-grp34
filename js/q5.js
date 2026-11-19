// q5_heatmap.js

// 1. 定义绘图的基本尺寸（请根据你们网页的实际布局调整）
// 1. Define the basic dimensions for the chart (adjust according to your actual web layout)
const width = 900;
const height = 450;
const margin = { top: 40, right: 120, bottom: 60, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// 2. 选中目标容器（HTML同学需要在页面放一个 <svg id="q5-heatmap"></svg> 或 <div id="q5-heatmap"></div>）
// 这里假设他们提供了一个包含 id="heatmap-container" 的容器
// 2. Select the target container (HTML needs to provide an <svg id="q5-heatmap"></svg> or <div id="q5-heatmap"></div>)
// Here we assume they provided a container with id="heatmap-container"
const svg = d3.select("#q5-heatmap")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`) // 保证响应式缩放 | Ensure responsive scaling
    .attr("preserveAspectRatio", "xMidYMid meet");

// 清除可能存在的旧内容（如果是单页应用动态加载的话）
// Clear any potentially existing old content (if dynamically loaded in a single-page app)
svg.selectAll("*").remove();

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 手动定义年龄组的显示顺序
// Manually define the display order of age groups
// const ageGroups = ['0-7', '8-16', '17-25', '26-39', '40-64', '65+'];

// 3. 读取 CSV 数据（请确保路径与你们项目的实际部署路径一致）
// 3. Read the CSV data (ensure the path matches your project's actual deployment path)
d3.csv("data/Q5_Export_q5_first_nations_stay.csv").then(function(data) {
    
    // 数据清洗：转格式
    // Data cleaning: convert formats
    data.forEach(d => {
        d.Year = +d.Year;
        d.Avg_Bed_Days = +d.Avg_Bed_Days;
        if (isNaN(d.Avg_Bed_Days)) d.Avg_Bed_Days = null; 
    });

    // ==========================================
    // 🌟 新增：动态获取并正确排序年龄组
    // 🌟 NEW: Dynamically extract and correctly sort age groups
    // ==========================================
    // 1. 提取所有唯一的 Age_Group 字符串
    // 1. Extract all unique Age_Group strings
    const rawAgeGroups = Array.from(new Set(data.map(d => d.Age_Group)));
    
    // 2. 自定义排序函数：提取字符串的第一个数字（比如把 "8-16" 变成 8，"65+" 变成 65）
    // 2. Custom sort function: Extract the leading number from the string (e.g., "8-16" becomes 8, "65+" becomes 65)
    const ageGroups = rawAgeGroups.sort((a, b) => {
        // parseInt 会自动提取开头的数字，遇到 '-' 或 '+' 就停止
        // parseInt automatically extracts the leading integer, stopping at '-' or '+'
        const numA = parseInt(a, 10); 
        const numB = parseInt(b, 10);
        return numA - numB; // 升序排列 | Ascending order
    });
    
    // 获取所有年份
    // Get all unique years
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    // 4. 设置比例尺 (Scales)
    // 4. Set up scales
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, innerWidth])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(ageGroups)
        .range([0, innerHeight])
        .padding(0.05);

    const minVal = d3.min(data, d => d.Avg_Bed_Days);
    const maxVal = d3.max(data, d => d.Avg_Bed_Days);

    // 颜色比例尺（黄到红渐变）
    // Color scale (Yellow to Red gradient)
    const colorScale = d3.scaleSequential()
        .domain([minVal, maxVal])
        .interpolator(d3.interpolateYlOrRd);

    // 5. 绘制 X 轴
    // 5. Draw X-axis
    g.append("g")
        .attr("class", "x-axis") // HTML/CSS同学可以通过 .x-axis 控制样式 | HTML/CSS can control styles via .x-axis
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    // X 轴标签
    // X-axis label
    g.append("text")
        .attr("class", "axis-label x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    // 6. 绘制 Y 轴
    // 6. Draw Y-axis
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Y 轴标签
    // Y-axis label
    g.append("text")
        .attr("class", "axis-label y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Age Group");

    // 7. 绘制热力图方块
    // 注意：这里没有使用 d3.select("#tooltip")，而是由 HTML 同学提供一个全局的 tooltip div
    // 7. Draw heatmap rectangles
    // Note: We are not creating a tooltip here; HTML provides a global tooltip div
    g.selectAll(".cell")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cell") // CSS同学可以在这里加 hover 效果 | CSS can add hover effects here
        .attr("x", d => xScale(d.Year))
        .attr("y", d => yScale(d.Age_Group))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => d.Avg_Bed_Days === null ? "#e0e0e0" : colorScale(d.Avg_Bed_Days))
        .attr("rx", 2) 
        .attr("ry", 2)
        // 交互：鼠标悬停（基础版）
        // Interaction: mouseover (basic version)
        .on("mouseover", function(event, d) {
            d3.select(this).raise();
            // 假设 HTML 里有一个 <div id="tooltip"></div>
            // Assuming HTML has a <div id="tooltip"></div>
            const tooltip = d3.select("#tooltip");
            if (!tooltip.empty()) {
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>Year:</strong> ${d.Year}<br>
                        <strong>Age Group:</strong> ${d.Age_Group}<br>
                        <strong>Avg Stay:</strong> ${d.Avg_Bed_Days === null ? 'Data Not Provided' : d.Avg_Bed_Days.toFixed(2) + ' days'}
                    `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mousemove", function(event) {
            // 鼠标移动时更新 Tooltip 位置
            // Update Tooltip position on mousemove
            const tooltip = d3.select("#tooltip");
            if (!tooltip.empty()) {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            // 鼠标移出时隐藏 Tooltip
            // Hide Tooltip on mouseout
            const tooltip = d3.select("#tooltip");
            if (!tooltip.empty()) {
                tooltip.style("opacity", 0);
            }
        });

    // 8. 绘制颜色图例 (Legend)
    // 8. Draw the color legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legendX = innerWidth + 40; 

    // 创建渐变定义
    // Create gradient definition
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%");

    // 添加渐变色带
    // Add gradient color stops
    d3.range(0, 1.1, 0.1).forEach(d => {
        linearGradient.append("stop")
            .attr("offset", `${d * 100}%`)
            .attr("stop-color", colorScale(minVal + d * (maxVal - minVal)));
    });

    // 绘制图例矩形
    // Draw the legend rectangle
    g.append("rect")
        .attr("x", legendX)
        .attr("y", innerHeight - legendHeight)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

    // 添加图例文字 (最大值)
    // Add legend label (Max value)
    g.append("text")
        .attr("class", "legend-label")
        .attr("x", legendX + legendWidth + 5)
        .attr("y", innerHeight - legendHeight + 10)
        .text(`${maxVal.toFixed(1)} days`);

    // 添加图例文字 (最小值)
    // Add legend label (Min value)
    g.append("text")
        .attr("class", "legend-label")
        .attr("x", legendX + legendWidth + 5)
        .attr("y", innerHeight - 5)
        .text(`${minVal.toFixed(1)} days`);

    // 添加图例标题
    // Add legend title
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", legendX + 10)
        .attr("y", innerHeight - legendHeight - 10)
        .attr("text-anchor", "middle")
        .text("Severity");

}).catch(function(error) {
    // 如果 CSV 加载失败，在控制台打印错误
    // Log error to console if CSV loading fails
    console.error("Error loading the CSV file:", error);
});