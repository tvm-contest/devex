package async

import "context"

// Future interface has the method signature for await
type Future interface {
	Await() (out interface{}, err error)
}

type future struct {
	await func(ctx context.Context) (out interface{}, err error)
}

func (f future) Await() (out interface{}, err error) {
	return f.await(context.Background())
}

// Exec executes the async function
func Exec(f func() (out interface{}, err error)) Future {
	var result interface{}
	c := make(chan struct{})
	go func() {
		defer close(c)
		result, _ = f()
	}()
	return future{
		await: func(ctx context.Context) (out interface{}, err error) {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-c:
				return result, nil
			}
		},
	}
}
