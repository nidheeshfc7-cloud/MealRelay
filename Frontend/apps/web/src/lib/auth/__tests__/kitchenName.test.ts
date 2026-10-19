import { formatDefaultKitchenName } from "../kitchenName";

const runTests = () => {
  console.log("Testing formatDefaultKitchenName...");

  const cases: Array<{ input: string; expected: string }> = [
    { input: "IIT Bombay", expected: "IIT Bombay's kitchen" },
    { input: "BMSIT", expected: "BMSIT's kitchen" },
    { input: "St. Joseph's", expected: "St. Joseph's kitchen" },
    { input: "Sri Sai Hostel Mess", expected: "Sri Sai Hostel Mess's kitchen" },
    { input: "Central Kitchen", expected: "Central Kitchen" },
    { input: "Campus's kitchen", expected: "Campus's kitchen" },
    { input: "Campus's Kitchen", expected: "Campus's Kitchen" },
    { input: "", expected: "Your kitchen" },
    { input: "   ", expected: "Your kitchen" },
  ];

  let failed = 0;
  for (const { input, expected } of cases) {
    const actual = formatDefaultKitchenName(input);
    if (actual !== expected) {
      console.error(`FAIL: formatDefaultKitchenName("${input}") = "${actual}", expected "${expected}"`);
      failed++;
    } else {
      console.log(`PASS: "${input}" -> "${actual}"`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`\nALL ${cases.length} TESTS PASSED!`);
  }
};

runTests();
