export const starterCode = `def find_max(xs):
    m = xs[0]
    for i in range(len(xs)+1):  # off-by-one
        if xs[i] > m:
            m = xs[i]
    return m`
