
// TO-DO:
// eliminate gl-matrix class
// need to force black(?) background (VRR)
// ** impact flash doesn't work (VRR)
// ** track glow doesn't work (VRR)
// don't create images all at the end
// optimize BeginScene (eliminate entirely w/out backgroundColor)
// don't use img.src for key lookup
// does _applyCanvasXForm always need to be applied?
// TGS.AddRequiredImagesToAssetList & remote images

// gl-matrix 1.0.1 - https://github.com/toji/gl-matrix/blob/master/LICENSE.md
var MatrixArray=typeof Float32Array!=="undefined"?Float32Array:Array,glMatrixArrayType=MatrixArray,vec3={},mat3={},mat4={},quat4={};vec3.create=function(a){var b=new MatrixArray(3);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2]);return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a===c)return a[0]-=b[0],a[1]-=b[1],a[2]-=b[2],a;c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g===1)return b[0]=c,b[1]=d,b[2]=e,b}else return b[0]=0,b[1]=0,b[2]=0,b;g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1],a=a[2],g=b[0],f=b[1],b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1],a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
vec3.direction=function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1],a=a[2]-b[2],b=Math.sqrt(d*d+e*e+a*a);if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c};vec3.lerp=function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d};vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};
mat3.create=function(a){var b=new MatrixArray(9);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8]);return b};mat3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b};mat3.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a};
mat3.transpose=function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b};mat3.toMat4=function(a,b){b||(b=mat4.create());b[15]=1;b[14]=0;b[13]=0;b[12]=0;b[11]=0;b[10]=a[8];b[9]=a[7];b[8]=a[6];b[7]=0;b[6]=a[5];b[5]=a[4];b[4]=a[3];b[3]=0;b[2]=a[2];b[1]=a[1];b[0]=a[0];return b};
mat3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"};mat4.create=function(a){var b=new MatrixArray(16);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8],b[9]=a[9],b[10]=a[10],b[11]=a[11],b[12]=a[12],b[13]=a[13],b[14]=a[14],b[15]=a[15]);return b};
mat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b};mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.transpose=function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b};
mat4.determinant=function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],i=a[7],j=a[8],k=a[9],l=a[10],n=a[11],o=a[12],m=a[13],p=a[14],a=a[15];return o*k*h*e-j*m*h*e-o*f*l*e+g*m*l*e+j*f*p*e-g*k*p*e-o*k*d*i+j*m*d*i+o*c*l*i-b*m*l*i-j*c*p*i+b*k*p*i+o*f*d*n-g*m*d*n-o*c*h*n+b*m*h*n+g*c*p*n-b*f*p*n-j*f*d*a+g*k*d*a+j*c*h*a-b*k*h*a-g*c*l*a+b*f*l*a};
mat4.inverse=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],n=a[10],o=a[11],m=a[12],p=a[13],r=a[14],s=a[15],A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*m,y=k*r-n*m,z=k*s-o*m,C=l*r-n*p,D=l*s-o*p,E=n*s-o*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+n*v-o*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-m*w+r*t-s*B)*q;b[7]=(k*w-n*t+o*B)*q;b[8]=(f*D-h*z+j*x)*q;
	b[9]=(-c*D+d*z-g*x)*q;b[10]=(m*v-p*t+s*A)*q;b[11]=(-k*v+l*t-o*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-m*u+p*B-r*A)*q;b[15]=(k*u-l*B+n*A)*q;return b};mat4.toRotationMat=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat4.toMat3=function(a,b){b||(b=mat3.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b};mat4.toInverseMat3=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],i=a[8],j=a[9],k=a[10],l=k*f-h*j,n=-k*g+h*i,o=j*g-f*i,m=c*l+d*n+e*o;if(!m)return null;m=1/m;b||(b=mat3.create());b[0]=l*m;b[1]=(-k*d+e*j)*m;b[2]=(h*d-e*f)*m;b[3]=n*m;b[4]=(k*c-e*i)*m;b[5]=(-h*c+e*g)*m;b[6]=o*m;b[7]=(-j*c+d*i)*m;b[8]=(f*c-d*g)*m;return b};
mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],n=a[9],o=a[10],m=a[11],p=a[12],r=a[13],s=a[14],a=a[15],A=b[0],B=b[1],t=b[2],u=b[3],v=b[4],w=b[5],x=b[6],y=b[7],z=b[8],C=b[9],D=b[10],E=b[11],q=b[12],F=b[13],G=b[14],b=b[15];c[0]=A*d+B*h+t*l+u*p;c[1]=A*e+B*i+t*n+u*r;c[2]=A*g+B*j+t*o+u*s;c[3]=A*f+B*k+t*m+u*a;c[4]=v*d+w*h+x*l+y*p;c[5]=v*e+w*i+x*n+y*r;c[6]=v*g+w*j+x*o+y*s;c[7]=v*f+w*k+x*m+y*a;c[8]=z*d+C*h+D*l+E*p;c[9]=z*e+C*i+D*n+E*r;c[10]=z*g+C*
	j+D*o+E*s;c[11]=z*f+C*k+D*m+E*a;c[12]=q*d+F*h+G*l+b*p;c[13]=q*e+F*i+G*n+b*r;c[14]=q*g+F*j+G*o+b*s;c[15]=q*f+F*k+G*m+b*a;return c};mat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c};
mat4.multiplyVec4=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c};
mat4.translate=function(a,b,c){var d=b[0],e=b[1],b=b[2],g,f,h,i,j,k,l,n,o,m,p,r;if(!c||a===c)return a[12]=a[0]*d+a[4]*e+a[8]*b+a[12],a[13]=a[1]*d+a[5]*e+a[9]*b+a[13],a[14]=a[2]*d+a[6]*e+a[10]*b+a[14],a[15]=a[3]*d+a[7]*e+a[11]*b+a[15],a;g=a[0];f=a[1];h=a[2];i=a[3];j=a[4];k=a[5];l=a[6];n=a[7];o=a[8];m=a[9];p=a[10];r=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=i;c[4]=j;c[5]=k;c[6]=l;c[7]=n;c[8]=o;c[9]=m;c[10]=p;c[11]=r;c[12]=g*d+j*e+o*b+a[12];c[13]=f*d+k*e+m*b+a[13];c[14]=h*d+l*e+p*b+a[14];c[15]=i*d+n*e+r*b+a[15];
	return c};mat4.scale=function(a,b,c){var d=b[0],e=b[1],b=b[2];if(!c||a===c)return a[0]*=d,a[1]*=d,a[2]*=d,a[3]*=d,a[4]*=e,a[5]*=e,a[6]*=e,a[7]*=e,a[8]*=b,a[9]*=b,a[10]*=b,a[11]*=b,a;c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c};
mat4.rotate=function(a,b,c,d){var e=c[0],g=c[1],c=c[2],f=Math.sqrt(e*e+g*g+c*c),h,i,j,k,l,n,o,m,p,r,s,A,B,t,u,v,w,x,y,z;if(!f)return null;f!==1&&(f=1/f,e*=f,g*=f,c*=f);h=Math.sin(b);i=Math.cos(b);j=1-i;b=a[0];f=a[1];k=a[2];l=a[3];n=a[4];o=a[5];m=a[6];p=a[7];r=a[8];s=a[9];A=a[10];B=a[11];t=e*e*j+i;u=g*e*j+c*h;v=c*e*j-g*h;w=e*g*j-c*h;x=g*g*j+i;y=c*g*j+e*h;z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;d?a!==d&&(d[12]=a[12],d[13]=a[13],d[14]=a[14],d[15]=a[15]):d=a;d[0]=b*t+n*u+r*v;d[1]=f*t+o*u+s*v;d[2]=k*t+m*u+A*
	v;d[3]=l*t+p*u+B*v;d[4]=b*w+n*x+r*y;d[5]=f*w+o*x+s*y;d[6]=k*w+m*x+A*y;d[7]=l*w+p*x+B*y;d[8]=b*z+n*e+r*g;d[9]=f*z+o*e+s*g;d[10]=k*z+m*e+A*g;d[11]=l*z+p*e+B*g;return d};mat4.rotateX=function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[4],g=a[5],f=a[6],h=a[7],i=a[8],j=a[9],k=a[10],l=a[11];c?a!==c&&(c[0]=a[0],c[1]=a[1],c[2]=a[2],c[3]=a[3],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[4]=e*b+i*d;c[5]=g*b+j*d;c[6]=f*b+k*d;c[7]=h*b+l*d;c[8]=e*-d+i*b;c[9]=g*-d+j*b;c[10]=f*-d+k*b;c[11]=h*-d+l*b;return c};
mat4.rotateY=function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],i=a[8],j=a[9],k=a[10],l=a[11];c?a!==c&&(c[4]=a[4],c[5]=a[5],c[6]=a[6],c[7]=a[7],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+i*-d;c[1]=g*b+j*-d;c[2]=f*b+k*-d;c[3]=h*b+l*-d;c[8]=e*d+i*b;c[9]=g*d+j*b;c[10]=f*d+k*b;c[11]=h*d+l*b;return c};
mat4.rotateZ=function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],i=a[4],j=a[5],k=a[6],l=a[7];c?a!==c&&(c[8]=a[8],c[9]=a[9],c[10]=a[10],c[11]=a[11],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+i*d;c[1]=g*b+j*d;c[2]=f*b+k*d;c[3]=h*b+l*d;c[4]=e*-d+i*b;c[5]=g*-d+j*b;c[6]=f*-d+k*b;c[7]=h*-d+l*b;return c};
mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b*=a;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e,g,f,h,i,j,k,l,n=a[0],o=a[1],a=a[2];g=c[0];f=c[1];e=c[2];c=b[1];j=b[2];if(n===b[0]&&o===c&&a===j)return mat4.identity(d);c=n-b[0];j=o-b[1];k=a-b[2];l=1/Math.sqrt(c*c+j*j+k*k);c*=l;j*=l;k*=l;b=f*k-e*j;e=e*c-g*k;g=g*j-f*c;(l=Math.sqrt(b*b+e*e+g*g))?(l=1/l,b*=l,e*=l,g*=l):g=e=b=0;f=j*g-k*e;h=k*b-c*g;i=c*e-j*b;(l=Math.sqrt(f*f+h*h+i*i))?(l=1/l,f*=l,h*=l,i*=l):i=h=f=0;d[0]=b;d[1]=f;d[2]=c;d[3]=0;d[4]=e;d[5]=h;d[6]=j;d[7]=0;d[8]=g;d[9]=i;d[10]=k;d[11]=
	0;d[12]=-(b*n+e*o+g*a);d[13]=-(f*n+h*o+i*a);d[14]=-(c*n+j*o+k*a);d[15]=1;return d};mat4.fromRotationTranslation=function(a,b,c){c||(c=mat4.create());var d=a[0],e=a[1],g=a[2],f=a[3],h=d+d,i=e+e,j=g+g,a=d*h,k=d*i;d*=j;var l=e*i;e*=j;g*=j;h*=f;i*=f;f*=j;c[0]=1-(l+g);c[1]=k+f;c[2]=d-i;c[3]=0;c[4]=k-f;c[5]=1-(a+g);c[6]=e+h;c[7]=0;c[8]=d+i;c[9]=e-h;c[10]=1-(a+l);c[11]=0;c[12]=b[0];c[13]=b[1];c[14]=b[2];c[15]=1;return c};
mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4.create=function(a){var b=new MatrixArray(4);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]);return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a===b)return a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e)),a;b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a===b)return a[0]*=-1,a[1]*=-1,a[2]*=-1,a;b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f===0)return b[0]=0,b[1]=0,b[2]=0,b[3]=0,b;f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3],f=b[0],h=b[1],i=b[2],b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=a[0],f=a[1],h=a[2],a=a[3],i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d,d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c*=i;var l=d*h;d*=i;e*=i;f*=g;h*=g;g*=i;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=k-g;b[4]=1-(j+e);b[5]=d+f;b[6]=c+h;b[7]=d-f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c*=i;var l=d*h;d*=i;e*=i;f*=g;h*=g;g*=i;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=0;b[4]=k-g;b[5]=1-(j+e);b[6]=d+f;b[7]=0;b[8]=c+h;b[9]=d-f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
quat4.slerp=function(a,b,c,d){d||(d=a);var e=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],g,f;if(Math.abs(e)>=1)return d!==a&&(d[0]=a[0],d[1]=a[1],d[2]=a[2],d[3]=a[3]),d;g=Math.acos(e);f=Math.sqrt(1-e*e);if(Math.abs(f)<0.001)return d[0]=a[0]*0.5+b[0]*0.5,d[1]=a[1]*0.5+b[1]*0.5,d[2]=a[2]*0.5+b[2]*0.5,d[3]=a[3]*0.5+b[3]*0.5,d;e=Math.sin((1-c)*g)/f;c=Math.sin(c*g)/f;d[0]=a[0]*e+b[0]*c;d[1]=a[1]*e+b[1]*c;d[2]=a[2]*e+b[2]*c;d[3]=a[3]*e+b[3]*c;return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};



TGE.WebGLRenderer = function(canvas)
{
	TGE.WebGLRenderer.superclass.constructor.call(this);

	this._mGL = null;
	this._mCanvasContextProxy = new TGE.WebGLRenderer.CanvasContextProxy();
	this._mAlpha = 1;
	this._mWorldTransform = null;
	this._mFunctional = false;
	this._mShaders = {};
	this._mViewMatrix = mat4.create();
	this._mProjectionMatrix = mat4.create();
	this._mRectangleVertexBuffer = null;
	this._mRectangleVertexColorBuffer = null;
	this._mRectangleTextureCoordBuffer = null;
	this._mSpriteVert1 = new TGE.Vector2D(0,0);
	this._mSpriteVert2 = new TGE.Vector2D(1,0);
	this._mSpriteVert3 = new TGE.Vector2D(0,1);
	this._mSpriteVert4 = new TGE.Vector2D(1,1);
	this._mSpriteXForm = new TGE.Matrix();

	// Filters
	this._mCurrentShaderName = "";
	this._mCurrentTexture = -1;

	try
	{
		this._mGL = canvas.getContext("webgl",{ alpha:false }); // http://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html
		this._mGL.viewport(0, 0, this._mGL.drawingBufferWidth, this._mGL.drawingBufferHeight);
	}
	catch(e)
	{
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "WebGL setup error: " + e);
		return;
	}

	// Should be good to go now, but anything below this can still set it false
	this._mFunctional = true;

	this._initShaders();
	this._initBuffers();
	this._createBlankTexture();

	// We will need to use text rendered to offscreen canvas
	TGE.Text.CacheByDefault = true;

    return this;
}


TGE.WebGLRenderer.prototype =
{
	type: function()
	{
		return "WebGL";
	},

	functional: function()
	{
		return this._mFunctional;
	},

	getCanvasContext: function()
	{
		return this._mCanvasContextProxy;
	},

	resizedGameDiv: function()
	{
		// Set the projection matrix (2D orthographic)
		mat4.ortho(0,this._mGL.drawingBufferWidth,this._mGL.drawingBufferHeight,0,0,100,this._mProjectionMatrix);

		// Set the viewport bounds
		this._mGL.viewport(0,0,this._mGL.drawingBufferWidth,this._mGL.drawingBufferHeight);

		// Set the model-view matrix
		mat4.identity(this._mViewMatrix);
	},

	rendererProcessImage: function(texture,htmlImageElement,spritesheet)
	{
		texture.glTexture = this._createGLTextureFromImage(htmlImageElement);
	},

	getImageSize: function(size)
	{
		var pow = 1;
		while(pow<size)
		{
			pow *= 2;
		}
		return pow;
	},

	beginScene: function(bgColor)
	{
		var clearMask = this._mGL.DEPTH_BUFFER_BIT;
		if(bgColor)
		{
			var colorStr = bgColor.length<7 ? (bgColor[1]+bgColor[1]+bgColor[2]+bgColor[2]+bgColor[3]+bgColor[3]) :bgColor.substring(1);
			var bigint = parseInt(colorStr, 16);
			this._mGL.clearColor(((bigint >> 16) & 255)/255, ((bigint >> 8) & 255)/255, (bigint & 255)/255, 1.0);
			clearMask = this._mGL.COLOR_BUFFER_BIT | this._mGL.DEPTH_BUFFER_BIT;
		}

		// Clear the buffers
		this._mGL.disable(this._mGL.DEPTH_TEST);
		this._mGL.clear(clearMask);

		// Default states
		this._mGL.blendFunc(this._mGL.SRC_ALPHA, this._mGL.ONE_MINUS_SRC_ALPHA);
		this._mGL.enable(this._mGL.BLEND);
		this._mGL.activeTexture(this._mGL.TEXTURE0);

		// Clear filters
		this._mCurrentShaderName = "";
		this._mCurrentTexture = -1;
	},

	endScene: function()
	{

	},

	setWorldTransform: function(transform,stageScale)
	{
		this._mWorldTransform = transform;
	},

	setAlpha: function(alpha)
	{
		this._mAlpha = alpha;
	},

	fillRectangle: function(x,y,width,height,color)
	{
		// Figure out the RGB color components
		var colorStr = color.length<7 ? (color[1]+color[1]+color[2]+color[2]+color[3]+color[3]) : color.substring(1);
		var bigint = parseInt(colorStr, 16);
		var r = ((bigint >> 16) & 255)/255;
		var g = ((bigint >> 8) & 255)/255;
		var b = (bigint & 255)/255;

		this._drawSprite(this._mWorldTransform,width,height,0,0,r,g,b,this._mAlpha,null,0,0,1,1,"standard");
	},

	gradientFill: function(direction,color1,color2,transitionPoint,width,height)
	{

	},

	drawImage: function(texture,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight)
	{
		var tw = sWidth/texture.htmlImageElement.width;
		var th = sHeight/texture.htmlImageElement.height;
		var tx1 = sx/texture.htmlImageElement.width;
		var tx2 = tx1 + tw;
		var ty1 = sy/texture.htmlImageElement.height;
		var ty2 = ty1 + th;

		this._drawSprite(this._mWorldTransform,dWidth,dHeight,dx,dy,1,1,1,this._mAlpha,texture,tx1,ty1,tx2,ty2,"standard");
	},

	alphamapOffscreenText: function()
	{
		return true;
	},

	updateTextImage: function(texture,offscreenCanvas)
	{
		if(texture===null)
		{
			texture = this.createTexture();
			texture.glTexture = this._mGL.createTexture();
		}

		this._mGL.bindTexture(this._mGL.TEXTURE_2D, texture.glTexture);
		this._mGL.texImage2D(this._mGL.TEXTURE_2D, 0, this._mGL.RGBA, this._mGL.RGBA, this._mGL.UNSIGNED_BYTE, offscreenCanvas);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MAG_FILTER, this._mGL.LINEAR);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MIN_FILTER, this._mGL.LINEAR_MIPMAP_NEAREST);
		this._mGL.generateMipmap(this._mGL.TEXTURE_2D);
		//this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_S, this._mGL.CLAMP_TO_EDGE);
		//this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_T, this._mGL.CLAMP_TO_EDGE);

		return texture;
	},

	drawTextImage: function(texture,color,width,height,cachePadding,tx,ty)
	{
		// Figure out the RGB color components
		var colorStr = color.length<7 ? (color[1]+color[1]+color[2]+color[2]+color[3]+color[3]) : color.substring(1);
		var bigint = parseInt(colorStr, 16);
		var r = ((bigint >> 16) & 255)/255;
		var g = ((bigint >> 8) & 255)/255;
		var b = (bigint & 255)/255;

		this._drawSprite(this._mWorldTransform,width+cachePadding*2,height+cachePadding*2,-cachePadding,-cachePadding,r,g,b,this._mAlpha,texture,0,0,tx,ty,"text");
	},


	// ********** Internal Methods ********** //

	/** @ignore */
	_initShaders: function()
	{
		var vShaderStr,tfShaderStr;

		// Standard Shader:

		vShaderStr = [
			"attribute vec3 aVertexPosition;",
			"attribute vec4 aVertexColor;",
			"attribute vec2 aTextureCoord;",
			"uniform mat4 uMVMatrix;",
			"uniform mat4 uPMatrix;",
			"varying vec4 vColor;",
			"varying vec2 vTextureCoord;",
			"void main(void)",
			"{ gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
			"vColor = aVertexColor;",
			"vTextureCoord = aTextureCoord; }"
		].join("\n");

		tfShaderStr = [
			"precision mediump float;",
			"varying vec4 vColor;",
			"varying vec2 vTextureCoord;",
			"uniform sampler2D uSampler;",
			"void main(void)",
			"{ vec4 fragmentColor;",
			"fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
			"gl_FragColor = vec4(fragmentColor.rgb * vColor.rgb, fragmentColor.a * vColor.a);",
			"}"
		].join("\n");

		this._createShader("standard",vShaderStr,tfShaderStr);


		// Text Shader:

		tfShaderStr = [
			"precision mediump float;",
			"varying vec4 vColor;",
			"varying vec2 vTextureCoord;",
			"uniform sampler2D uSampler;",
			"void main(void)",
			"{ vec4 fragmentColor;",
			"fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
			"gl_FragColor = vec4(vColor.rgb, fragmentColor.r * vColor.a);",
			"}"
		].join("\n");

		this._createShader("text",vShaderStr,tfShaderStr);


		/*var shaderStr = [
			"precision mediump float;",
			"varying vec4 vColor;",
			"varying vec2 vTextureCoord;",
			"uniform sampler2D uSampler;",
			"void main(void) { gl_FragColor = vec4(vColor.rgb, vColor.a);}"
		].join("\n");*/
	},

	_createShader: function(name,vShaderStr,tfShaderStr)
	{
		var fragmentShader = this._createTextureFragmentShader(tfShaderStr);
		var vertexShader = this._createVertexShader(vShaderStr);

		var shaderProgram = this._mGL.createProgram();
		this._mGL.attachShader(shaderProgram, vertexShader);
		this._mGL.attachShader(shaderProgram, fragmentShader);
		this._mGL.linkProgram(shaderProgram);

		if(!this._mGL.getProgramParameter(shaderProgram, this._mGL.LINK_STATUS))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "error creating '" + name + "' shader");
			return;
		}

		this._mGL.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = this._mGL.getAttribLocation(shaderProgram, "aVertexPosition");
		this._mGL.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.vertexColorAttribute = this._mGL.getAttribLocation(shaderProgram, "aVertexColor");
		this._mGL.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		shaderProgram.textureCoordAttribute = this._mGL.getAttribLocation(shaderProgram, "aTextureCoord");
		this._mGL.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

		shaderProgram.pMatrixUniform = this._mGL.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = this._mGL.getUniformLocation(shaderProgram, "uMVMatrix");
		shaderProgram.samplerUniform = this._mGL.getUniformLocation(shaderProgram, "uSampler");

		this._mShaders[name] = shaderProgram;
	},

	/** @ignore */
	_createTextureFragmentShader: function(shaderStr)
	{
		var shader = this._mGL.createShader(this._mGL.FRAGMENT_SHADER);
		this._mGL.shaderSource(shader, shaderStr);
		this._mGL.compileShader(shader);

		if(!this._mGL.getShaderParameter(shader, this._mGL.COMPILE_STATUS))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "unable to initialize texture fragment shader: " + this._mGL.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	},

	/** @ignore */
	_createVertexShader: function(shaderStr)
	{
		var shader = this._mGL.createShader(this._mGL.VERTEX_SHADER);
		this._mGL.shaderSource(shader, shaderStr);
		this._mGL.compileShader(shader);

		if (!this._mGL.getShaderParameter(shader, this._mGL.COMPILE_STATUS))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "unable to initialize vertex shader: " + this._mGL.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	},

	/** @ignore */
	_initBuffers: function()
	{
		// -------------------------------------------------------------------------
		// Vertex buffers for drawing rectangles
		this._mRectangleVertexBuffer = this._mGL.createBuffer();
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleVertexBuffer);
		var vertices = [
			10.0,  10.0,  0.0,
			-10.0,  10.0,  0.0,
			10.0, -10.0,  0.0,
			-10.0, -10.0,  0.0
		];
		this._mGL.bufferData(this._mGL.ARRAY_BUFFER, new Float32Array(vertices), this._mGL.DYNAMIC_DRAW);
		this._mRectangleVertexBuffer.itemSize = 3;
		this._mRectangleVertexBuffer.numItems = 4;

		this._mRectangleVertexColorBuffer = this._mGL.createBuffer();
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleVertexColorBuffer);
		var colors = [];
		for(var i=0; i < 4; i++)
		{
			colors = colors.concat([1,1,1,1]);
		}
		this._mGL.bufferData(this._mGL.ARRAY_BUFFER, new Float32Array(colors), this._mGL.DYNAMIC_DRAW);
		this._mRectangleVertexColorBuffer.itemSize = 4;
		this._mRectangleVertexColorBuffer.numItems = 4;

		this._mRectangleTextureCoordBuffer = this._mGL.createBuffer();
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleTextureCoordBuffer);
		var textureCoords = [
			1.0, 1.0,
			0.0, 1.0,
			1.0, 0.0,
			0.0, 0.0
		];
		this._mGL.bufferData(this._mGL.ARRAY_BUFFER, new Float32Array(textureCoords), this._mGL.DYNAMIC_DRAW);
		this._mRectangleTextureCoordBuffer.itemSize = 2;
		this._mRectangleTextureCoordBuffer.numItems = 4;
	},

	/** @ignore */
	_createBlankTexture: function()
	{
		var texture = this.createTexture();
		texture.glTexture = this._mGL.createTexture();

		this._mGL.bindTexture(this._mGL.TEXTURE_2D, texture.glTexture);

		var size = 1;
		var canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,size,size);
		var image = canvas;

		this._mGL.texImage2D(this._mGL.TEXTURE_2D, 0, this._mGL.RGBA, this._mGL.RGBA, this._mGL.UNSIGNED_BYTE, image);
		//this._mGL.bindTexture(this._mGL.TEXTURE_2D, null);

		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MAG_FILTER, this._mGL.LINEAR);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MIN_FILTER, this._mGL.LINEAR);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_S, this._mGL.CLAMP_TO_EDGE);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_T, this._mGL.CLAMP_TO_EDGE);
	},

	/** @ignore */
	_createGLTextureFromImage: function(htmlImageElement)
	{
		var glTexture = this._mGL.createTexture();
		glTexture.image = htmlImageElement;

		this._mGL.bindTexture(this._mGL.TEXTURE_2D, glTexture);

		// This can fail due to cross-domain issues, so make sure it doesn't block
		try
		{
			this._mGL.texImage2D(this._mGL.TEXTURE_2D, 0, this._mGL.RGBA, this._mGL.RGBA, this._mGL.UNSIGNED_BYTE, glTexture.image);
		}
		catch(e)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "error binding texture: " + e);
			return null;
		}

		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MAG_FILTER, this._mGL.LINEAR);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_MIN_FILTER, this._mGL.LINEAR);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_S, this._mGL.CLAMP_TO_EDGE);
		this._mGL.texParameteri(this._mGL.TEXTURE_2D, this._mGL.TEXTURE_WRAP_T, this._mGL.CLAMP_TO_EDGE);
		//this._mGL.generateMipmap(this._mGL.TEXTURE_2D);

		this._mGL.bindTexture(this._mGL.TEXTURE_2D, null);

		return glTexture;
	},

	/** @ignore */
	_drawSprite: function(xform,width,height,offsetX,offsetY,r,g,b,a,texture,tx1,ty1,tx2,ty2,shaderName)
	{
		// Shader
		var shader = this._setShader(shaderName);

		// Texture
		this._setTexture(texture);

		// Update and bind vertex buffer
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleVertexBuffer);

		// Transform the sprite coordinates into modelview space
		this._mSpriteXForm.copyFrom(xform);
		this._mSpriteVert1.x = this._mSpriteVert1.y = this._mSpriteVert2.y = this._mSpriteVert3.x = 0;
		this._mSpriteVert2.x = this._mSpriteVert4.x = width;
		this._mSpriteVert3.y = this._mSpriteVert4.y = height;

		// Apply the offset
		if(offsetX!==0 || offsetY!==0)
		{
			var m1 = this._mSpriteXForm._internal;
			m1[2] = m1[0]*offsetX + m1[1]*offsetY + m1[2];
			m1[5] = m1[3]*offsetX + m1[4]*offsetY + m1[5];
		}

		this._mSpriteXForm.transformPoint(this._mSpriteVert1);
		this._mSpriteXForm.transformPoint(this._mSpriteVert2);
		this._mSpriteXForm.transformPoint(this._mSpriteVert3);
		this._mSpriteXForm.transformPoint(this._mSpriteVert4);

		vertices = [
			this._mSpriteVert4.x, this._mSpriteVert4.y,  0.0,
			this._mSpriteVert3.x, this._mSpriteVert3.y,  0.0,
			this._mSpriteVert2.x, this._mSpriteVert2.y,  0.0,
			this._mSpriteVert1.x, this._mSpriteVert1.y,  0.0
		];

		this._mGL.bufferSubData(this._mGL.ARRAY_BUFFER, 0, new Float32Array(vertices));
		this._mGL.vertexAttribPointer(shader.vertexPositionAttribute, this._mRectangleVertexBuffer.itemSize, this._mGL.FLOAT, false, 0, 0);

		// Update and bind vertex color buffer
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleVertexColorBuffer);
		var colors = [];
		for(var i=0; i < 4; i++)
		{
			colors = colors.concat([r,g,b,a]);
		}
		this._mGL.bufferSubData(this._mGL.ARRAY_BUFFER, 0, new Float32Array(colors));
		this._mGL.vertexAttribPointer(shader.vertexColorAttribute, this._mRectangleVertexColorBuffer.itemSize, this._mGL.FLOAT, false, 0, 0);

		// Update and bind texture coordinate buffer
		this._mGL.bindBuffer(this._mGL.ARRAY_BUFFER, this._mRectangleTextureCoordBuffer);
		this._mGL.bufferSubData(this._mGL.ARRAY_BUFFER, 0, new Float32Array([tx2, ty2, tx1, ty2, tx2, ty1, tx1, ty1]));
		this._mGL.vertexAttribPointer(shader.textureCoordAttribute, this._mRectangleTextureCoordBuffer.itemSize, this._mGL.FLOAT, false, 0, 0);

		// Draw it
		this._mGL.drawArrays(this._mGL.TRIANGLE_STRIP, 0, this._mRectangleVertexBuffer.numItems);
	},

	/** @ignore */
	_setShader: function(shaderName)
	{
		// Filter redundant calls
		if(shaderName===this._mCurrentShaderName)
		{
			return this._mShaders[shaderName];
		}

		var shader = this._mShaders[shaderName];
		if(!shader)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "invalid shader: " + shader);
			return;
		}
		this._mGL.useProgram(shader);
		this._mGL.uniformMatrix4fv(shader.pMatrixUniform, false, this._mProjectionMatrix);
		this._mGL.uniformMatrix4fv(shader.mvMatrixUniform, false, this._mViewMatrix);
		this._mGL.uniform1i(shader.samplerUniform, 0);

		this._mCurrentShaderName = shaderName;

		return shader;
	},

	/** @ignore */
	_setTexture: function(texture)
	{
		// Filter redundant calls
		var id = texture ? texture.id : 0;
		if(id===this._mCurrentTexture)
		{
			return;
		}

		var glTexture = texture ? texture.glTexture : this.getTextureByID(0).glTexture;
		this._mGL.bindTexture(this._mGL.TEXTURE_2D, glTexture);

		this._mCurrentTexture = id;
	},

	/** @ignore */
	_blendModeFromString: function(str)
	{
		var mode = this._mGL.ONE;
		switch(str)
		{
			case "ZERO":                    return this._mGL.ZERO;
			case "ONE":                     return this._mGL.ONE;
			case "SRC_COLOR":               return this._mGL.SRC_COLOR;
			case "ONE_MINUS_SRC_COLOR":     return this._mGL.ONE_MINUS_SRC_COLOR;
			case "SRC_ALPHA":               return this._mGL.SRC_ALPHA;
			case "ONE_MINUS_SRC_ALPHA":     return this._mGL.ONE_MINUS_SRC_ALPHA;
			case "DEST_ALPHA":              return this._mGL.DEST_ALPHA;
			case "ONE_MINUS_DEST_ALPHA":    return this._mGL.ONE_MINUS_DEST_ALPHA;
			case "DEST_COLOR":              return this._mGL.DEST_COLOR;
			case "ONE_MINUS_DEST_COLOR":    return this._mGL.ONE_MINUS_DEST_COLOR;
		}

		return mode;
	}
}
extend(TGE.WebGLRenderer, TGE.Renderer);



/** @ignore */
TGE.WebGLRenderer.VertexBuffer = function(canvas)
{


	return this;
}
/** @ignore */
TGE.WebGLRenderer.VertexBuffer.prototype =
{
	flush: function()
	{

	}
}



/** @ignore */
TGE.WebGLRenderer.CanvasContextProxy = function(canvas)
{
	this.canvasDrawnOn = false;

	return this;
}
/** @ignore */
TGE.WebGLRenderer.CanvasContextProxy.prototype =
{
	scale: function(x,y)
	{

	},

	beginPath: function()
	{

	},

	closePath: function()
	{
		this.canvasDrawnOn = true;
	},

	moveTo: function(x,y)
	{

	},

	lineTo: function(x,y)
	{
		this.canvasDrawnOn = true;
	},

	arcTo: function(x1,y1,x2,y2,r)
	{
		this.canvasDrawnOn = true;
	},

	arc: function(x,y,r,sAngle,eAngle,counterclockwise)
	{
		this.canvasDrawnOn = true;
	},

	fill: function()
	{
		this.canvasDrawnOn = true;
	},

	stroke: function()
	{
		this.canvasDrawnOn = true;
	},

	save: function()
	{

	},

	restore: function()
	{

	},
}

Object.defineProperty(TGE.WebGLRenderer.CanvasContextProxy.prototype, 'fillStyle', {
	set: function(a)
	{

	}
});

Object.defineProperty(TGE.WebGLRenderer.CanvasContextProxy.prototype, 'strokeStyle', {
	set: function(a)
	{

	}
});

Object.defineProperty(TGE.WebGLRenderer.CanvasContextProxy.prototype, 'lineWidth', {
	set: function(a)
	{

	}
});