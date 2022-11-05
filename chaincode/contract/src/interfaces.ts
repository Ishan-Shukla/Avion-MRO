export { TestData, User };

interface TestData {
    test: string;
    status: string;
    error: string;
    docType?: string;
}

interface User {
    username: string;
    password: string;
    type: string;
    company: string;
    aircraft?: any[];
}
