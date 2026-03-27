import type { Skill } from "../types.js";

export const reactExpert: Skill = {
  id: "react-expert",
  name: "React Expert",
  description:
    "React specialist for production-grade web applications. Component architecture, hooks, state management, Server Components, performance.",
  invocation: "/react-expert",
  source: "file",
  category: "frontend",
  content: `# React Expert

Senior React specialist with deep expertise in React 19, Server Components, and production-grade application architecture.

## Role Definition

You are a senior React engineer with 10+ years of frontend experience. You specialize in React 19 patterns including Server Components, the \`use()\` hook, and form actions. You build accessible, performant applications with TypeScript and modern state management.

## When to Use This Skill

- Building new React components or features
- Implementing state management (local, Context, Redux, Zustand)
- Optimizing React performance
- Setting up React project architecture
- Working with React 19 Server Components
- Implementing forms with React 19 actions
- Data fetching patterns with TanStack Query or \`use()\`

## Core Workflow

1. **Analyze requirements** - Identify component hierarchy, state needs, data flow
2. **Choose patterns** - Select appropriate state management, data fetching approach
3. **Implement** - Write TypeScript components with proper types
4. **Optimize** - Apply memoization where needed, ensure accessibility
5. **Test** - Write tests with React Testing Library

## Constraints

### MUST DO
- Use TypeScript with strict mode
- Implement error boundaries for graceful failures
- Use \`key\` props correctly (stable, unique identifiers)
- Clean up effects (return cleanup function)
- Use semantic HTML and ARIA for accessibility
- Memoize when passing callbacks/objects to memoized children
- Use Suspense boundaries for async operations

### MUST NOT DO
- Mutate state directly
- Use array index as key for dynamic lists
- Create functions inside JSX (causes re-renders)
- Forget useEffect cleanup (memory leaks)
- Ignore React strict mode warnings
- Skip error boundaries in production

## Output Templates

When implementing React features, provide:
1. Component file with TypeScript types
2. Test file if non-trivial logic
3. Brief explanation of key decisions

## Knowledge Reference

React 19, Server Components, use() hook, Suspense, TypeScript, TanStack Query, Zustand, Redux Toolkit, React Router, React Testing Library, Vitest/Jest, Next.js App Router, accessibility (WCAG)`,
  references: [
    {
      filename: "hooks-patterns.md",
      title: "Hooks Patterns",
      loadWhen: "Custom hooks, useEffect, useCallback, useMemo",
      content: `# Hooks Patterns

## Custom Hook Pattern

\`\`\`tsx
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(\`HTTP \${res.status}\`); return res.json(); })
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [url]);

  return { data, error, loading };
}
\`\`\`

## useDebounce

\`\`\`tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
\`\`\`

## useLocalStorage

\`\`\`tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}
\`\`\`

## useCallback & useMemo

\`\`\`tsx
// useCallback: Memoize functions (for child dependencies)
const handleClick = useCallback((id: string) => { setSelected(id); }, []);

// useMemo: Memoize expensive calculations
const sortedItems = useMemo(() =>
  [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
\`\`\`

## Effect Cleanup

\`\`\`tsx
useEffect(() => {
  let cancelled = false;
  async function fetchData() {
    const data = await api.getData();
    if (!cancelled) setData(data);
  }
  fetchData();
  return () => { cancelled = true };
}, []);
\`\`\``,
    },
    {
      filename: "performance.md",
      title: "Performance Optimization",
      loadWhen: "Performance, memo, lazy loading, optimization",
      content: `# Performance Optimization

## React.memo

\`\`\`tsx
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});
\`\`\`

## Code Splitting with lazy()

\`\`\`tsx
const HeavyChart = lazy(() => import('./HeavyChart'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      {showChart && <HeavyChart data={data} />}
    </Suspense>
  );
}
\`\`\`

## useTransition for Non-urgent Updates

\`\`\`tsx
function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    startTransition(() => { setResults(filterItems(e.target.value)); });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results items={results} />}
    </>
  );
}
\`\`\`

| Technique | When to Use |
|-----------|-------------|
| \`memo()\` | Prevent re-renders from unchanged props |
| \`useMemo()\` | Cache expensive calculations |
| \`useCallback()\` | Stable function references |
| \`lazy()\` | Code split heavy components |
| \`useTransition()\` | Keep UI responsive during updates |`,
    },
    {
      filename: "react-19-features.md",
      title: "React 19 Features",
      loadWhen: "React 19, use() hook, useActionState, form actions",
      content: `# React 19 Features

## use() Hook

\`\`\`tsx
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}

function Post({ postId }: { postId: string }) {
  const commentsPromise = fetchComments(postId);
  return (
    <article>
      <PostContent id={postId} />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </article>
  );
}
\`\`\`

## useActionState

\`\`\`tsx
async function submitAction(prevState: FormState, formData: FormData): Promise<FormState> {
  'use server';
  try {
    await subscribe(formData.get('email') as string);
    return { success: true };
  } catch {
    return { error: 'Failed to subscribe' };
  }
}

function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {});
  return (
    <form action={formAction}>
      <input name="email" type="email" required disabled={isPending} />
      <button type="submit" disabled={isPending}>{isPending ? 'Subscribing...' : 'Subscribe'}</button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
\`\`\`

## useOptimistic

\`\`\`tsx
function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function addTodo(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimisticTodo({ id: 'temp', text, completed: false });
    await createTodo(text);
  }

  return (
    <>
      <ul>{optimisticTodos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>
      <form action={addTodo}><input name="text" /><button>Add</button></form>
    </>
  );
}
\`\`\`

## ref as Prop (No forwardRef in React 19)

\`\`\`tsx
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
\`\`\``,
    },
    {
      filename: "server-components.md",
      title: "Server Components",
      loadWhen: "Server Components, RSC, streaming, Next.js App Router",
      content: `# Server Components

## Server vs Client Components

\`\`\`tsx
// Server Component (default in App Router)
async function ProductList() {
  const products = await db.products.findMany();
  return <ul>{products.map(p => <ProductCard key={p.id} product={p} />)}</ul>;
}

// Client Component
'use client';
function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  return <button onClick={() => addToCart(productId)} disabled={loading}>Add to Cart</button>;
}
\`\`\`

## Streaming with Suspense

\`\`\`tsx
export default function Page() {
  return (
    <main>
      <FastComponent />
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </main>
  );
}
\`\`\`

## Server Actions

\`\`\`tsx
'use server';
export async function createPost(formData: FormData) {
  await db.posts.create({ data: { title: formData.get('title') as string } });
  revalidatePath('/posts');
}
\`\`\`

| Type | Can Use | Cannot Use |
|------|---------|------------|
| Server | async/await, db, fs | useState, onClick |
| Client | hooks, events, browser APIs | async component |`,
    },
    {
      filename: "state-management.md",
      title: "State Management",
      loadWhen: "State management, Context, Zustand, Redux",
      content: `# State Management

## Zustand (Recommended for medium complexity)

\`\`\`tsx
const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price, 0),
    }),
    { name: 'cart-storage' }
  )
);
\`\`\`

## TanStack Query (Server State)

\`\`\`tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;
  return <UserCard user={data} onUpdate={mutation.mutate} />;
}
\`\`\`

| Solution | Best For |
|----------|----------|
| useState | Local component state |
| Context | Theme, auth, simple globals |
| Zustand | Medium complexity, minimal boilerplate |
| Redux Toolkit | Complex state, middleware, devtools |
| TanStack Query | Server state, caching |`,
    },
    {
      filename: "testing-react.md",
      title: "Testing React",
      loadWhen: "Testing, React Testing Library, Jest, Vitest",
      content: `# Testing React

## Basic Component Test

\`\`\`tsx
test('increments counter on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
\`\`\`

## Testing Forms

\`\`\`tsx
test('submits form with user data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();
  render(<ContactForm onSubmit={handleSubmit} />);
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.type(screen.getByLabelText('Email'), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(handleSubmit).toHaveBeenCalledWith({ name: 'John Doe', email: 'john@example.com' });
});
\`\`\`

## Mocking API Calls with MSW

\`\`\`tsx
const server = setupServer(
  http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: params.id, name: 'John' }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
\`\`\`

## Testing Hooks

\`\`\`tsx
test('useCounter increments', () => {
  const { result } = renderHook(() => useCounter());
  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
});
\`\`\`

| Query | Use When |
|-------|----------|
| \`getByRole\` | Buttons, links, headings |
| \`getByLabelText\` | Form inputs |
| \`findByX\` | Async/loading content |
| \`queryByX\` | Assert NOT present |`,
    },
  ],
};
