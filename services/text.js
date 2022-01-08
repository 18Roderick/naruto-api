const arr = [
	{ name: "foo", bandera: 10 },
	{ name: "bar", bandera: 4 },
	{ name: "baz", bandera: null },
	{ name: "foo2", bandera: null },
];

const arr2 = arr.reduce((prev, current) => {
	let newArr = !Array.isArray(prev) ? [prev, current] : prev;
	newArr[0].name = newArr[0].name.concat(", ", current.name);
	return newArr;
});

console.log(arr2, arr2.length);
