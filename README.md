# k3s-app-template

Template repo para apps que se despliegan en el cluster k3s prod (snotrasys/goliat).

```
git push (main)         → ArgoCD sync prod    → https://<app>.goliat.snotrasys.com
gh pr create            → ArgoCD preview      → https://<app>-<branch>-<sha>.goliat.snotrasys.com
gh pr close             → cleanup automático  → recursos eliminados
```

Stack incluido:
- Node.js + Express (placeholder, reemplazá por tu código)
- Multi-stage Dockerfile
- GitHub Actions workflow → Harbor (`apps/<repo-name>`)
- k8s manifests con kustomize (base + prod overlay)
- ArgoCD Application + ApplicationSet (preview por PR)

## Cómo crear un nuevo app desde este template

### 1. Crear repo desde el template

```bash
gh repo create snotrasys/mi-app --template snotrasys/k3s-app-template --private --clone
cd mi-app
```

### 2. Personalizar nombres

Reemplaza `__APP_NAME__` con el nombre del repo:

```bash
APP=$(basename $(pwd))   # autodetecta del nombre del directorio = nombre del repo
echo "App: $APP"

# macOS:
find k8s argocd src Dockerfile -type f \( -name "*.yaml" -o -name "*.js" -o -name "Dockerfile" \) \
  -exec sed -i '' "s/__APP_NAME__/${APP}/g" {} +

# Linux:
# find k8s argocd src Dockerfile -type f -exec sed -i "s/__APP_NAME__/${APP}/g" {} +

git add -A && git commit -m "chore: personalize from template" && git push
```

### 3. Setear secrets en GitHub Actions

Una vez por repo (o setear a nivel org):

```bash
echo "<harbor-user>"     | gh secret set HARBOR_USER
echo "<harbor-password>" | gh secret set HARBOR_PASSWORD
```

(Usar robot account de Harbor — admin password solo para demo.)

### 4. Aplicar ArgoCD apps

Copia `argocd/application.yaml` al repo central de gitops o aplica directo:

```bash
kubectl apply -f argocd/application.yaml
```

ArgoCD watcha tu repo. Push a main → deploy prod. Open PR → preview.

### 5. Apuntar dominio prod (si es nuevo)

Si tu app usa un dominio diferente a `<app>.goliat.snotrasys.com`, edita `k8s/prod/kustomization.yaml`:

```yaml
patches:
  - target: { kind: IngressRoute, name: app }
    patch: |-
      - op: replace
        path: /spec/routes/0/match
        value: Host(`api.midominio.com`)
```

Y agrega ese dominio al Traefik dynamic config en obs-buffer (si no es `*.goliat.snotrasys.com`).

## Estructura del template

```
.
├── src/server.js                        # placeholder Node.js Express
├── package.json
├── Dockerfile                            # multi-stage, node:24-alpine
├── .dockerignore
├── .github/workflows/
│   └── build-deploy.yml                  # kaniko + Harbor (apps/<repo>)
├── k8s/
│   ├── base/                             # manifests sin namespace
│   │   ├── namespace.yaml                # placeholder, patched per env
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingressroute.yaml             # placeholder host, patched
│   │   └── kustomization.yaml
│   └── prod/                             # overlay producción
│       └── kustomization.yaml
└── argocd/
    └── application.yaml                  # Application + ApplicationSet
```

## Convenciones del cluster

| Capa | Patrón | Ejemplo |
|---|---|---|
| Harbor project | `apps/` | `apps/mi-app:abc123` |
| k8s namespace prod | `<app>` | `mi-app` |
| k8s namespace preview | `<app>-pr-<N>` | `mi-app-pr-42` |
| Dominio prod | propio o `<app>.goliat.snotrasys.com` | `mi-app.goliat.snotrasys.com` |
| Dominio preview | `<app>-<branch>-<sha>.goliat.snotrasys.com` | `mi-app-feature-x-abc1234.goliat.snotrasys.com` |
| ArgoCD AppProject | `default` (por ahora — agruparemos por brand después) | `default` |

## Cuando agrupemos por brand

Sin tocar este template, el reagrupamiento es:

```bash
# crear AppProject
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata: { name: <brand>, namespace: argocd }
spec: { ... }
EOF

# reasignar Application
kubectl -n argocd patch app mi-app-prod --type merge -p '{"spec":{"project":"<brand>"}}'

# (opcional) crear Harbor project <brand> + cambiar HARBOR_PROJECT en workflow
```

## Local dev

```bash
npm install
npm start    # http://localhost:3000
```

## Troubleshooting

| Problema | Causa | Fix |
|---|---|---|
| Workflow falla con "Repository not found" | GitHub App no instalado en este repo | Settings → Integrations → instalar `k3s-prod-arc` |
| ApplicationSet no genera Application en PR | App App tarda en ver el PR | Esperar ~60s (requeueAfterSeconds) |
| Pods con ImagePullBackOff | Imagen no existe | Workflow build OK? Mira logs |
| Preview URL devuelve 404 | k3s Traefik no tiene IngressRoute aún | ArgoCD synced? `kubectl get app -n argocd` |
| Cert TLS inválido | DNS no resuelve a IP failover | Wildcard `*.goliat.snotrasys.com` activo? |

## Referencias

- Cluster docs: `https://github.com/snotrasys/k3s-prod`
- Demo funcionando: `https://github.com/snotrasys/k3s-demo-react`
