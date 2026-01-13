import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Todos heading", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /todos/i });
  expect(heading).toBeInTheDocument();
});
