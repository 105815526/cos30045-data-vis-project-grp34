const width = 900;
const height = 450;
const margin = { top: 40, right: 120, bottom: 60, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = d3.select("#q5-heatmap")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

svg.selectAll("*").remove();

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/Q5_Export_q5_first_nations_stay.csv").then(function(data) {
    
    data.forEach(d => {
        d.Year = +d.Year;
        d.Avg_Bed_Days = +d.Avg_Bed_Days;
        if (isNaN(d.Avg_Bed_Days)) d.Avg_Bed_Days = null; 
    });

    const rawAgeGroups = Array.from(new Set(data.map(d => d.Age_Group)));
    
    const ageGroups = rawAgeGroups.sort((a, b) => {
        const numA = parseInt(a, 10); 
        const numB = parseInt(b, 10);
        return numA - numB;
    });
    
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

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

    const colorScale = d3.scaleSequential()
        .domain([minVal, maxVal])
        .interpolator(d3.interpolateYlOrRd);

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    g.append("text")
        .attr("class", "axis-label x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    g.append("text")
        .attr("class", "axis-label y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Age Group");

    g.selectAll(".cell")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", d => xScale(d.Year))
        .attr("y", d => yScale(d.Age_Group))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => d.Avg_Bed_Days === null ? "#e0e0e0" : colorScale(d.Avg_Bed_Days))
        .attr("rx", 2) 
        .attr("ry", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).raise();
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
            const tooltip = d3.select("#tooltip");
            if (!tooltip.empty()) {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            const tooltip = d3.select("#tooltip");
            if (!tooltip.empty()) {
                tooltip.style("opacity", 0);
            }
        });

    const legendWidth = 20;
    const legendHeight = 200;
    const legendX = innerWidth + 40; 

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%");

    d3.range(0, 1.1, 0.1).forEach(d => {
        linearGradient.append("stop")
            .attr("offset", `${d * 100}%`)
            .attr("stop-color", colorScale(minVal + d * (maxVal - minVal)));
    });

    g.append("rect")
        .attr("x", legendX)
        .attr("y", innerHeight - legendHeight)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

    g.append("text")
        .attr("class", "legend-label")
        .attr("x", legendX + legendWidth + 5)
        .attr("y", innerHeight - legendHeight + 10)
        .text(`${maxVal.toFixed(2)} days`);

    g.append("text")
        .attr("class", "legend-label")
        .attr("x", legendX + legendWidth + 5)
        .attr("y", innerHeight - 5)
        .text(`${minVal.toFixed(2)} days`);

    g.append("text")
        .attr("class", "axis-label")
        .attr("x", legendX + 10)
        .attr("y", innerHeight - legendHeight - 10)
        .attr("text-anchor", "middle")
        .text("Severity");

}).catch(function(error) {
    console.error("Error loading the CSV file:", error);
});
